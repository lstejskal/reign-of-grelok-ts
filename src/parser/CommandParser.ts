
import type { CommandsData } from '../gameData/types.js';

/**
 * CommandParser parses raw command line into a canonical verb, its parameters
 * and the `command_alias` used to look up custom actions and messages.
 */

export interface ParsedCommand {
    command: string;
    params: string[];
    commandAlias: string;
}

// The "which X do you mean" case (doc §5 step 12): two or more active
// objects matched a partial name, so the whole command is abandoned
// rather than guessing. `ambiguity` is the message to show the player.
export interface ParseAmbiguity {
    ambiguity: string;
}

export type ParseResult = ParsedCommand | ParseAmbiguity;

export function isAmbiguous<T extends object>(result: T | ParseAmbiguity): result is ParseAmbiguity {
    return 'ambiguity' in result;
}

const TWO_PARAM_COMMANDS = new Set(['give', 'use', 'attack', 'ask']);

// Checked in this priority order, not by position in the line — the first
// of these found anywhere among the tokens is what splits the two params.
const CONJUNCTION_PRIORITY = ['to', 'on', 'with', 'about'];

// Verb -> the conjunction its command_alias is built with.
const ALIAS_CONJUNCTIONS: Record<string, string> = { use: 'on', give: 'to', ask: 'about' };

// One leading preposition gets dropped after the verb: "look (at) sword", "talk (to) wizard"...
const DROPPABLE_PREPOSITIONS = new Set(['at', 'up', 'to', 'with', 'on']);

export function parseCommand(line: string, activeObjects: string[], commands: CommandsData): ParseResult {
    const tokens = line.trim().split(/\s+/);

    let command = resolveVerb(tokens.shift() ?? '', commands);

    if (tokens.length > 0 && DROPPABLE_PREPOSITIONS.has(tokens[0])) {
        tokens.shift();
    }

    let params = groupParams(command, tokens);

    // attack Y with X -> use X on Y
    if (command === 'attack') {
        command = 'use';
        params = [...params].reverse();
    }

    // go_north -> command "go", param "north"
    if (command.startsWith('go_')) {
        const [goCommand, direction] = command.split('_');
        command = goCommand;
        params = [direction];
    }

    // "put rusty sword" as two tokens that are actually one active
    // object's name -> treat as a single param instead of two.
    if (params.length === 2 && activeObjects.includes(params.join(' '))) {
        params = [params.join('_')];
    }

    const resolved = resolveActiveObjectNames(params, activeObjects);
    if (isAmbiguous(resolved)) {
        return resolved;
    }

    return {
        command,
        params: resolved.params,
        commandAlias: buildCommandAlias(command, resolved.params),
    };
}

// First entry in `commands` whose alias list contains `token` wins; a verb
// with no matching alias is used verbatim, which is how data-only verbs
// like `drink`, `push`, `move` reach custom_actions.yml/messages.yml.
function resolveVerb(token: string, commands: CommandsData): string {
    for (const [canonical, aliases] of Object.entries(commands)) {
        if (aliases.includes(token)) {
            return canonical;
        }
    }
    return token;
}

function groupParams(command: string, tokens: string[]): string[] {
    if (!TWO_PARAM_COMMANDS.has(command)) {
        return tokens.length > 0 ? [tokens.join('_')] : [];
    }

    for (const conjunction of CONJUNCTION_PRIORITY) {
        if (!tokens.includes(conjunction)) {
            continue;
        }

        const joined = tokens.join('_');
        const marker = `_${conjunction}_`;
        const splitAt = joined.indexOf(marker);

        if (splitAt !== -1) {
            return [joined.slice(0, splitAt), joined.slice(splitAt + marker.length)];
        }
    }

    return tokens;
}

// Matches each param against the active objects (inventory + what's
// visible here): an exact name match is left as-is; otherwise, try to
// match it against the part of an active object's name after its first
// word ("sword" matches "rusty sword"). Exactly one match -> replace the
// param with that object's alias-shaped name. Two or more -> abort with
// an ambiguity message. No match -> leave the param unchanged (it might
// be a data-only word the custom-action/message layer still recognizes).
function resolveActiveObjectNames(
    params: string[],
    activeObjects: string[],
): { params: string[] } | ParseAmbiguity {
    const resolved: string[] = [];

    for (const rawParam of params) {
        if (activeObjects.includes(rawParam)) {
            resolved.push(rawParam);
            continue;
        }

        let chosenItem: string | undefined;

        for (const item of activeObjects) {
            const firstSpace = item.indexOf(' ');
            if (firstSpace === -1) {
                continue;
            }

            const suffix = item.slice(firstSpace + 1);
            if (rawParam !== suffix) {
                continue;
            }

            if (chosenItem === undefined) {
                chosenItem = item;
            } else {
                return { ambiguity: `Which ${rawParam} do you mean: ${chosenItem}, ${item} or something else?` };
            }
        }

        resolved.push(chosenItem !== undefined ? chosenItem.replace(/ /g, '_') : rawParam);
    }

    return { params: resolved };
}

function buildCommandAlias(command: string, params: string[]): string {
    if (params.length <= 1) {
        return `${command}_${params[0] ?? ''}`;
    }

    const conjunction = ALIAS_CONJUNCTIONS[command];
    if (conjunction) {
        return [command, params[0], conjunction, params[1]].join('_');
    }

    return [command, ...params].join('_');
}
