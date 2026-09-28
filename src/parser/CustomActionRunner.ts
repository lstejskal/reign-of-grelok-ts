
import { Game } from '../models/Game.js';
import { Message } from '../models/Message.js';
import { Thing } from '../models/Thing.js';
import type { ConstraintsData } from '../gameData/types.js';

/**
 * CustomAcctionRunner interprets the `custom_actions.yml` scripting DSL, 
 * which is where all of the game's puzzle logic lives (revealing hidden things, 
 * unlocking doors, advancing NPC dialogue, ...).
 */

export interface PerformResult {
    // Whether `commandAlias` had a script at all. 
    // `false` means "not my business, try the next thing"
    handled: boolean;

    // game over means either user ended the game manually or won it
    gameOver: boolean;
}

export class CustomActionRunner {
    constructor(
        private readonly game: Game,
        private readonly messages: Message,
        private readonly constraints: ConstraintsData,
        private readonly say: (text: string) => void,
    ) {}

    perform(command: string, params: string[], commandAlias: string, currentLocation: string): PerformResult {
        const script = this.game.customActions[commandAlias];
        if (script === undefined) {
            return { handled: false, gameOver: false };
        }

        if (!this.checkGenericPreconditions(command, params, currentLocation)) {
            return { handled: true, gameOver: false };
        }

        for (const instruction of script) {
            const result = this.runInstruction(instruction, commandAlias);

            if (result === 'game-over') {
                return { handled: true, gameOver: true };
            }

            if (!result) {
                // `quiet`, or a failed `verify` — either way the script
                // stops here and the automatic command_alias message below
                // is skipped, since one was already said explicitly.
                return { handled: true, gameOver: false };
            }
        }

        this.sayIfPresent(commandAlias);
        return { handled: true, gameOver: false };
    }

    // checks that apply to every script for a given verb
    private checkGenericPreconditions(command: string, params: string[], currentLocation: string): boolean {
        if (command === 'use' || command === 'give') {
            const [what, target] = params;

            if (what === undefined || !this.isCarried(what)) {
                this.say(`You don't carry ${Thing.aliasToName(what ?? '')}.`);
                return false;
            }

            if (!this.isVisibleHere(target, currentLocation)) {
                this.say(`There's no ${Thing.aliasToName(target ?? '')} nearby.`);
                return false;
            }

            return true;
        }

        if (command === 'look_at' || command === 'talk_to' || command === 'ask') {
            const [subject] = params;

            if (!this.isVisibleHere(subject, currentLocation)) {
                this.say(`There's no ${Thing.aliasToName(subject ?? '')} nearby.`);
                return false;
            }

            return true;
        }

        return true;
    }

    private isCarried(thingAlias: string): boolean {
        return this.game.things[thingAlias]?.location === 'i';
    }

    private isVisibleHere(thingAlias: string | undefined, currentLocation: string): boolean {
        if (thingAlias === undefined) {
            return false;
        }
        const thing = this.game.things[thingAlias];
        return thing !== undefined && thing.visible && thing.location === currentLocation;
    }

    // --- instruction interpreter (doc §6.2) --------------------------------

    private runInstruction(instruction: string, commandAlias: string): boolean | 'game-over' {
        const [verb, ...args] = instruction.trim().split(/\s+/);

        switch (verb) {
            case 'verify':
                return this.runVerify(args);
            case 'say':
                this.sayIfPresent(args[0]);
                return true;
            case 'remove':
                this.setThingLocation(args[0], undefined);
                return true;
            case 'add':
                this.setThingLocation(args[0], 'i');
                return true;
            case 'visible':
                this.setThingVisible(args[0]);
                return true;
            case 'set':
                return this.runSet(args);
            case 'quiet':
                return false;
            case 'exit':
                // See PerformResult.gameOver: print the victory text before
                // ending, instead of Ruby's silent Kernel#exit.
                this.sayIfPresent(commandAlias);
                return 'game-over';
            default:
                // Unrecognized instructions are silently ignored
                return true;
        }
    }

    private runVerify(args: string[]): boolean {
        const [type, ...rest] = args;

        switch (type) {
            case 'location': {
                const [thingAlias, expectedLocation, msgKey] = rest;
                const ok = this.game.things[thingAlias]?.location === expectedLocation;
                if (!ok) {
                    this.sayIfPresent(msgKey);
                }
                return ok;
            }
            case 'boolean': {
                const [flag, maybeValue, maybeMsg] = rest;
                const hasExplicitValue = maybeValue === 'true' || maybeValue === 'false';
                const expected = hasExplicitValue ? maybeValue === 'true' : undefined;
                const msgKey = hasExplicitValue ? maybeMsg : maybeValue;

                const actual = this.constraints.boolean[flag] ?? false;
                const ok = expected === undefined ? actual : actual === expected;

                if (!ok) {
                    this.sayIfPresent(msgKey);
                }
                return ok;
            }
            default:
                throw new Error(`Unknown "verify" type: ${type}`);
        }
    }

    private runSet(args: string[]): boolean {
        const [target, ...rest] = args;

        switch (target) {
            case 'message': {
                const [oldKey, newKey] = rest;
                this.messages.replace(oldKey, newKey);
                return true;
            }
            case 'description-thing': {
                const [thingAlias, msgKey] = rest;
                const thing = this.game.things[thingAlias];
                const message = this.messages.findByAlias(msgKey);
                if (thing !== undefined && message !== undefined) {
                    thing.description = message;
                }
                return true;
            }
            case 'description-location': {
                const [locationAlias, msgKey] = rest;
                const location = this.game.locations[locationAlias];
                const message = this.messages.findByAlias(msgKey);
                if (location !== undefined && message !== undefined) {
                    location.description = message;
                }
                return true;
            }
            case 'constraint-boolean': {
                const [flag, value] = rest;
                this.constraints.boolean[flag] = value === 'true';
                return true;
            }
            case 'constraint-location': {
                const [locationDirection, msgKey] = rest;
                if (msgKey === 'nil') {
                    delete this.constraints.locations[locationDirection];
                } else {
                    this.constraints.locations[locationDirection] = this.messages.findByAlias(msgKey) ?? msgKey;
                }
                return true;
            }
            default:
                throw new Error(`Unknown "set" target: ${target}`);
        }
    }

    private setThingLocation(thingAlias: string, location: string | undefined): void {
        const thing = this.game.things[thingAlias];
        if (thing !== undefined) {
            thing.location = location;
        }
    }

    private setThingVisible(thingAlias: string): void {
        const thing = this.game.things[thingAlias];
        if (thing !== undefined) {
            thing.visible = true;
        }
    }

    private sayIfPresent(msgKey: string | undefined): void {
        if (msgKey === undefined) {
            return;
        }
        const message = this.messages.findByAlias(msgKey);
        if (message !== undefined) {
            this.say(message);
        }
    }
}
