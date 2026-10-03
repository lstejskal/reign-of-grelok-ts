
import { resolveVerb, TWO_PARAM_COMMANDS, DROPPABLE_PREPOSITIONS } from './CommandParser.js';
import type { CommandsData } from '../gameData/types.js';

/**
 * Tab-completion for the command line. Completes the verb on the first word,
 * and once a verb is known, completes object names - auto-inserting the
 * connecting preposition for two-object verbs as soon as the first object is
 * complete (e.g. "attack zo" -> "attack zombie with ").
 *
 * Always resolves to at most one candidate - the first match in the data's
 * own declared order. no match does nothing.
 */

// Verbs that take zero params: nothing past the verb word to complete.
const ZERO_PARAM_COMMANDS = new Set(['display_inventory', 'quit_game', 'save_game', 'load_game']);

// The preposition auto-inserted right after a two-param verb's first object is complete
const CONJUNCTION_BY_VERB: Record<string, string> = {
    give: 'to',
    use: 'on',
    ask: 'about',
    attack: 'with',
};

/**
 * Given the current input line, returns the full replacement line to show
 * once Tab is pressed, or null if there's nothing to complete.
 */
export function completeLine(line: string, activeObjects: string[], commands: CommandsData): string | null {
    const tokens = line.split(/\s+/);
    const fragment = tokens[tokens.length - 1];

    // Nothing currently being typed (empty line, or line ends in whitespace).
    if (fragment === '') {
        return null;
    }

    const committed = tokens.slice(0, -1);

    if (committed.length === 0) {
        return completeVerb(fragment, commands);
    }

    const verb = resolveVerb(committed[0], commands);

    if (ZERO_PARAM_COMMANDS.has(verb)) {
        return null;
    }

    const rest = dropLeadingPreposition(committed.slice(1));

    if (TWO_PARAM_COMMANDS.has(verb)) {
        return completeTwoParamObject(committed, rest, fragment, activeObjects, verb);
    }

    // One-param verbs, and anything CommandParser doesn't recognize, get the
    // same generic single-object completion.
    return completeSingleObject(committed, rest, fragment, activeObjects);
}

function completeVerb(fragment: string, commands: CommandsData): string | null {
    for (const aliases of Object.values(commands)) {
        for (const alias of aliases) {
            // Multi-word aliases (e.g. "talk to") can never match a single
            // typed token - see CommandParser's own note on that quirk.
            if (!alias.includes(' ') && alias.startsWith(fragment)) {
                return `${alias} `;
            }
        }
    }
    return null;
}

function dropLeadingPreposition(rest: string[]): string[] {
    if (rest.length > 0 && DROPPABLE_PREPOSITIONS.has(rest[0])) {
        return rest.slice(1);
    }
    return rest;
}

function completeSingleObject(
    committed: string[],
    prefixWords: string[],
    fragment: string,
    activeObjects: string[],
): string | null {
    const match = matchActiveObject(prefixWords, fragment, activeObjects);
    if (match === null) {
        return null;
    }

    return `${joinWithTrailing(keep(committed, prefixWords.length))}${match} `;
}

function completeTwoParamObject(
    committed: string[],
    restAfterPrep: string[],
    fragment: string,
    activeObjects: string[],
    verb: string,
): string | null {
    const conjunction = CONJUNCTION_BY_VERB[verb];
    const conjunctionIndex = restAfterPrep.indexOf(conjunction);

    if (conjunctionIndex === -1) {
        // Still completing object1: match it, then auto-append the conjunction.
        const match = matchActiveObject(restAfterPrep, fragment, activeObjects);
        if (match === null) {
            return null;
        }

        return `${joinWithTrailing(keep(committed, restAfterPrep.length))}${match} ${conjunction} `;
    }

    // Conjunction already typed: completing object2 from whatever follows it.
    const object2Words = restAfterPrep.slice(conjunctionIndex + 1);
    const match = matchActiveObject(object2Words, fragment, activeObjects);
    if (match === null) {
        return null;
    }

    return `${joinWithTrailing(keep(committed, object2Words.length))}${match} `;
}

// The leading committed words that belong to an earlier phase (the verb,
// any dropped preposition, an already-typed conjunction...) and are kept
// exactly as the player typed them - only the trailing `dropCount` words,
// which belong to the phase currently being completed, get replaced.
function keep(committed: string[], dropCount: number): string[] {
    return committed.slice(0, committed.length - dropCount);
}

// Matches full active-object names plus the last word of each multi-word name
function matchActiveObject(prefixWords: string[], fragment: string, activeObjects: string[]): string | null {
    const prefix = [...prefixWords, fragment].join(' ');
    const shortcuts = activeObjects
        .map((name) => name.split(' '))
        .filter((words) => words.length > 1)
        .map((words) => words[words.length - 1]);

    for (const candidate of [...activeObjects, ...shortcuts]) {
        if (candidate.startsWith(prefix)) {
            return candidate;
        }
    }

    return null;
}

function joinWithTrailing(words: string[]): string {
    return words.length === 0 ? '' : `${words.join(' ')} `;
}
