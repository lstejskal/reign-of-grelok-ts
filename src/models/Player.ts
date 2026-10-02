
import { Game } from './Game.js';
import { Location } from './Location.js';
import { Message } from './Message.js';
import { Thing } from './Thing.js';
import { chopToLines, toSentence } from '../utils.js';
import { parseCommand, isAmbiguous } from '../parser/CommandParser.js';
import { HELP_LINES } from '../helpText.js';
import { CustomActionRunner } from '../parser/CustomActionRunner.js';
import type { ConstraintsData, CommandsData, GameData } from '../gameData/types.js';

export interface ProcessLineResult {
    // true once the game should stop looping: `quit`/`exit`, or a custom
    // action's `exit` instruction (the win condition) — see
    // CustomActionRunner's PerformResult.gameOver.
    gameOver: boolean;
}

/**
 * Player holds game state: current location, inventory, constraints...)
 * and manages it through command handlers.
 */
export class Player {
    game: Game;
    messages: Message;
    constraints: ConstraintsData;
    commands: CommandsData;

    currentLocation: string;
    previousLocation: string | undefined;
    activeObjects: string[];

    // toggled by `extended prompt on|off`, off by default
    extendedPrompt: boolean;

    private readonly output: (text: string) => void;
    private readonly customActionRunner: CustomActionRunner;

    // Explicit table in place of Ruby's `respond_to?` + `send` — see
    // docs/ruby-implementation.md §5.2. Built once here (rather than
    // inline in processLine) so it's only allocated per Player, not per line.
    private readonly builtInHandlers: Record<string, (params: string[]) => void>;

    constructor(gameData: GameData, output: (text: string) => void = console.log) {
        this.output = output;
        this.game = new Game(gameData);

        // PS: upon new game and game load, start with fresh slate
        this.messages = new Message(structuredClone(gameData.messages));
        this.constraints = structuredClone(gameData.constraints);
        this.commands = gameData.commands;

        this.currentLocation = 'plain';
        this.previousLocation = undefined;
        this.activeObjects = [];
        this.extendedPrompt = false;

        this.customActionRunner = new CustomActionRunner(
            this.game,
            this.messages,
            this.constraints,
            (text) => this.say(text),
        );

        this.builtInHandlers = {
            look_at: (params) => this.lookAt(params[0]),
            pick_up: (params) => this.pickUp(params[0]),
            drop: (params) => this.drop(params[0]),
            go: (params) => this.go(params[0] ?? ''),
            talk_to: (params) => this.talkTo(params[0]),
            ask: (params) => this.ask(params[0]),
            give: (params) => this.give(params[0], params[1]),
            use: (params) => this.use(params[0], params[1]),
            display_inventory: () => this.displayInventory(),
            quit_game: () => this.quitGame(),
        };
    }

    get location(): Location {
        return this.game.locations[this.currentLocation];
    }

    // "\n[plain: n, s, e, w] > " when extended, else "\n> ".
    // Recomputed on every call so it always reflects the current location.
    get promptText(): string {
        if (!this.extendedPrompt) {
            return '\n> ';
        }

        const directionLetters = Object.keys(this.location.directions).join(', ');
        return `\n[${this.location.name.toLowerCase()}: ${directionLetters}] > `;
    }

    // --- command line processing ---------------------------------------

    // `process_line`: empty line / `h`|`help` / `extended prompt on|off` 
    // short-circuit (steps 1-3). otherwise tokenize and resolve
    // against custom actions / messages / built-in handlers, 
    // in that order (first hit wins, steps 4-15).
    processLine(line: string): ProcessLineResult {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            return { gameOver: false };
        }

        if (trimmedLine === 'h' || trimmedLine === 'help') {
            this.output('');
            HELP_LINES.forEach((helpLine) => this.output(helpLine));
            return { gameOver: false };
        }

        const extendedPromptMatch = trimmedLine.match(/^extended prompt (\w+)$/);
        if (extendedPromptMatch) {
            const arg = extendedPromptMatch[1].toLowerCase();
            if (arg === 'on') {
                this.extendedPrompt = true;
                this.say('extended prompt activated');
            } else if (arg === 'off') {
                this.extendedPrompt = false;
                this.say('extended prompt deactivated');
            } else {
                this.say('extended prompt: invalid parameter');
            }
            return { gameOver: false };
        }

        const parsed = parseCommand(trimmedLine, this.activeObjects, this.commands);

        if (isAmbiguous(parsed)) {
            this.say(parsed.ambiguity);
            return { gameOver: false };
        }

        const { command, params, commandAlias } = parsed;

        const customAction = this.customActionRunner.perform(command, params, commandAlias, this.currentLocation);
        if (customAction.handled) {
            return { gameOver: customAction.gameOver };
        }

        const message = this.messages.findByAlias(commandAlias);
        if (message !== undefined) {
            this.say(message);
            return { gameOver: false };
        }

        const handler = this.builtInHandlers[command];
        if (handler !== undefined) {
            handler(params);
            return { gameOver: command === 'quit_game' };
        }

        this.sayGibberish();
        return { gameOver: false };
    }

    // --- output -------------------------------------------------------

    say(text: string): void {
        this.output(chopToLines(text));
    }

    sayGibberish(): void {
        const gibberishCount = 3;
        const index = Math.floor(Math.random() * gibberishCount) + 1;
        const message = this.messages.findByAlias(`gibberish${index}`);
        if (message !== undefined) {
            this.say(message);
        }
    }

    // --- world state ----------------------------------------------------

    inventory(): string[] {
        return Object.values(this.game.things)
            .filter((thing) => thing.location === 'i')
            .map((thing) => thing.alias);
    }

    // Names of visible things in a location
    thingsInLocationBare(locationAlias: string = this.currentLocation): string[] {
        return Object.values(this.game.things)
            .filter((thing) => thing.inLocation(locationAlias) && thing.visible)
            .map((thing) => thing.name);
    }

    // Names of visible things in a location formatted into sentence
    thingsInLocation(locationAlias: string = this.currentLocation): string {
        const prepend = locationAlias === 'i' ? 'You carry ' : 'There is ';
        return toSentence(this.thingsInLocationBare(locationAlias), { prepend });
    }

    isActiveObject(thingAlias: string): boolean {
        return this.activeObjects.includes(Thing.aliasToName(thingAlias));
    }

    lookAround(): void {
        if (this.currentLocation !== this.previousLocation) {
            this.output('');
            this.say(`${this.location.name}\n\n`);
            this.say(`${this.location.description}\n\n`);
            this.say(`${this.location.formattedDirections()}\n`);
            this.say(`${this.thingsInLocation()}\n`);
            this.previousLocation = this.currentLocation;
        }

        this.activeObjects = [
            ...this.inventory().map((alias) => Thing.aliasToName(alias)),
            ...this.thingsInLocationBare(this.currentLocation),
        ];
    }

    // --- command handlers -------------------------------------------------

    canLookAt(thingAlias: string): boolean {
        const thing = this.game.things[thingAlias];
        return (
            thing !== undefined &&
            (thing.location === this.currentLocation || thing.location === 'i') &&
            thing.visible === true
        );
    }

    lookAt(thingAlias: string = ''): void {
        if (thingAlias === '') {
            this.previousLocation = undefined;
            return;
        }

        const thingName = Thing.aliasToName(thingAlias);
        this.say(
            this.canLookAt(thingAlias)
                ? `It's ${this.game.things[thingAlias].description}.`
                : `You can't see any ${thingName} here.`,
        );
    }

    canPickUp(thingAlias: string): boolean {
        const thing = this.game.things[thingAlias];
        return (
            thing !== undefined &&
            thing.visible &&
            thing.pickable &&
            thing.location === this.currentLocation
        );
    }

    pickUp(thingAlias: string = ''): void {
        const thingName = Thing.aliasToName(thingAlias);

        if (this.canPickUp(thingAlias)) {
            this.game.things[thingAlias].location = 'i';
            this.say(`You picked up ${thingName}.`);
        } else if (this.inventory().includes(thingAlias)) {
            this.say(`You already carry ${thingName}.`);
        } else if (thingName !== '') {
            this.say(`You can't pick up ${thingName}.`);
        } else {
            this.say('Pick up what?');
        }
    }

    drop(thingAlias: string = ''): void {
        const thingName = Thing.aliasToName(thingAlias);

        if (this.inventory().includes(thingAlias)) {
            this.game.things[thingAlias].location = this.currentLocation;
            this.say(`You dropped ${thingName}.`);
        } else if (thingName !== '') {
            this.say(`You don't carry ${thingName}.`);
        } else {
            this.say('Drop what?');
        }
    }

    canGo(direction: string): boolean {
        return (
            direction in this.location.directions &&
            !this.constraints.locations[`${this.currentLocation}-${direction}`]
        );
    }

    go(direction: string): void {
        const dir = direction.charAt(0);

        if (this.canGo(dir)) {
            this.currentLocation = this.location.directions[dir];
        } else {
            const blockedMessage = this.constraints.locations[`${this.currentLocation}-${dir}`];
            this.say(blockedMessage || "You can't go that way.");
        }
    }

    // talkTo/ask/give/use are fallbacks only: real dialogue and puzzle
    // logic live in messages.yml / custom_actions.yml  and get a first shot
    // at the command before these run
    talkTo(whom: string = ''): void {
        if (this.isActiveObject(whom)) {
            this.say("You can't chat with that.");
        } else {
            this.say(`Talk to whom? I don't see any ${Thing.aliasToName(whom)} around here.`);
        }
    }

    ask(whom: string = ''): void {
        if (this.isActiveObject(whom)) {
            const message = this.messages.findByAlias(`ask_${whom}_about_anything`);
            this.say(message ?? "You can't chat with that.");
        } else {
            this.say(`Ask whom? I don't see any ${Thing.aliasToName(whom)} around here.`);
        }
    }

    give(what: string = '', whom: string = ''): void {
        if (what === '') {
            this.sayGibberish();
        } else if (!this.inventory().includes(what)) {
            this.say(`You don't have ${Thing.aliasToName(what)}.`);
        } else if (whom === '') {
            this.say('Give to whom?');
        } else if (!this.isActiveObject(whom)) {
            this.say(`Give to whom? I don't see any ${Thing.aliasToName(whom)} around here.`);
        } else {
            const message = this.messages.findByAlias(`give_anything_to_${whom}`);
            this.say(message ?? 'That doesn\'t make sense.');
        }
    }

    // also stands in for "attack", which is rewriten into "use"
    use(what: string = '', target: string = ''): void {
        if (what === '') {
            this.sayGibberish();
        } else if (!this.inventory().includes(what)) {
            this.say(`You don't have ${Thing.aliasToName(what)}.`);
        } else if (target !== '' && !this.isActiveObject(target)) {
            this.say(`I don't see any ${Thing.aliasToName(target)} around here.`);
        } else {
            this.say('That doesn\'t make sense.');
        }
    }

    displayInventory(): void {
        this.say(this.inventory().length === 0 ? "You don't have anything." : this.thingsInLocation('i'));
    }

    quitGame(): void {
        this.say('Farewell!');
    }
}
