import { Game } from '../../models/Game';
import { Message } from '../../models/Message';
import { CustomActionRunner } from '../../parser/CustomActionRunner';
import type { GameData, ConstraintsData, MessagesData, CustomActionsData } from '../../gameData/types';

const DEFAULT_THINGS: GameData['things'] = {
    rusty_sword: { alias: 'rusty_sword', description: 'a rusty sword', location: 'i', pickable: true },
    gemstone: { alias: 'gemstone', description: 'a gemstone', location: 'mountain', pickable: true, visible: false },
    rubble: { alias: 'rubble', description: 'a pile of rubble', location: 'mountain', pickable: false },
    grelok: { alias: 'grelok', description: 'an evil wizard', location: 'mountain', pickable: false },
};

const DEFAULT_MESSAGES: MessagesData = {
    look_at_rubble: "It's a rubble.",
    look_at_rubble_hidden: "There's a gemstone in the rubble!",
    error_no_rusty_sword: 'Where is your sword?',
    use_shining_sword_on_grelok: 'Victory!',
    give_gemstone_to_wizard: 'Wizard is happy.',
};

interface Overrides {
    things?: GameData['things'];
    customActions?: CustomActionsData;
    constraints?: ConstraintsData;
    messages?: MessagesData;
}

function buildGameData(overrides: Overrides = {}): GameData {
    return {
        locations: {
            plain: { alias: 'plain', name: 'Plain', description: 'A wide plain.', directions: { n: 'mountain' } },
            mountain: { alias: 'mountain', name: 'Mountain', description: 'A cold mountain.', directions: { s: 'plain' } },
        },
        things: { ...DEFAULT_THINGS, ...overrides.things },
        commands: {},
        constraints: overrides.constraints ?? { locations: {}, boolean: { given_flag: true } },
        customActions: overrides.customActions ?? {},
        messages: { ...DEFAULT_MESSAGES, ...overrides.messages },
    };
}

function buildRunner(overrides: Overrides = {}) {
    const gameData = buildGameData(overrides);
    const game = new Game(gameData);
    const messages = new Message(structuredClone(gameData.messages));
    const constraints = structuredClone(gameData.constraints);
    const output: string[] = [];
    const runner = new CustomActionRunner(game, messages, constraints, (text) => output.push(text));
    return { runner, game, messages, constraints, output };
}

describe('CustomActionRunner', () => {
    test('returns handled: false when there is no script for the command alias', () => {
        const { runner } = buildRunner();
        const result = runner.perform('look_at', ['nonexistent'], 'look_at_nonexistent', 'plain');
        expect(result).toEqual({ handled: false, gameOver: false });
    });

    describe('generic preconditions (doc §6.1 step 2)', () => {
        test('blocks look_at/talk_to/ask scripts when the subject is not visible here', () => {
            const { runner, output } = buildRunner({
                customActions: { look_at_rubble: ['say look_at_rubble'] },
            });

            // rubble is on the mountain, not here
            const result = runner.perform('look_at', ['rubble'], 'look_at_rubble', 'plain');

            expect(result).toEqual({ handled: true, gameOver: false });
            expect(output).toEqual(["There's no rubble nearby."]);
        });

        test('blocks use/give scripts when the item is not carried', () => {
            const { runner, output } = buildRunner({
                customActions: { give_gemstone_shards_to_blacksmith: ['remove gemstone_shards'] },
                things: {
                    gemstone_shards: { alias: 'gemstone_shards', description: 'shards', location: 'plain', pickable: true },
                    blacksmith: { alias: 'blacksmith', description: 'a blacksmith', location: 'plain', pickable: false },
                },
            });

            const result = runner.perform('give', ['gemstone_shards', 'blacksmith'], 'give_gemstone_shards_to_blacksmith', 'plain');

            expect(result).toEqual({ handled: true, gameOver: false });
            expect(output).toEqual(["You don't carry gemstone shards."]);
        });

        test('blocks use/give scripts when the target is not visible here', () => {
            const { runner, output } = buildRunner({
                customActions: { use_rusty_sword_on_zombie: ['say zombie_falls'] },
                messages: { zombie_falls: 'The zombie falls.' },
                things: { zombie: { alias: 'zombie', description: 'a zombie', location: 'chapel', pickable: false } },
            });

            const result = runner.perform('use', ['rusty_sword', 'zombie'], 'use_rusty_sword_on_zombie', 'plain');

            expect(result).toEqual({ handled: true, gameOver: false });
            expect(output).toEqual(["There's no zombie nearby."]);
        });

        test('does not check anything for verbs other than use/give/look_at/talk_to/ask (drink quirk)', () => {
            const { runner, output } = buildRunner({
                customActions: { drink_from_jug: ['say passed'] },
                messages: { passed: "It doesn't check whether you carry the jug." },
            });

            const result = runner.perform('drink', ['jug'], 'drink_from_jug', 'plain');

            expect(result).toEqual({ handled: true, gameOver: false });
            expect(output).toEqual(["It doesn't check whether you carry the jug."]);
        });
    });

    describe('reveal idiom (verify + visible + quiet)', () => {
        test('reveals a hidden thing the first time', () => {
            const { runner, game, output } = buildRunner({
                customActions: {
                    look_at_rubble: ['say look_at_rubble', 'verify location gemstone mountain', 'visible gemstone', 'say look_at_rubble_hidden', 'quiet'],
                },
            });

            const result = runner.perform('look_at', ['rubble'], 'look_at_rubble', 'mountain');

            expect(result).toEqual({ handled: true, gameOver: false });
            expect(output).toEqual(["It's a rubble.", "There's a gemstone in the rubble!"]);
            expect(game.things.gemstone.visible).toBe(true);
        });

        test('once taken, verify fails and only the flavour text shows', () => {
            const { runner, game, output } = buildRunner({
                customActions: {
                    look_at_rubble: ['say look_at_rubble', 'verify location gemstone mountain', 'visible gemstone', 'say look_at_rubble_hidden', 'quiet'],
                },
            });
            game.things.gemstone.location = 'i';

            runner.perform('look_at', ['rubble'], 'look_at_rubble', 'mountain');

            expect(output).toEqual(["It's a rubble."]);
        });
    });

    describe('verify boolean', () => {
        test('with an explicit expected value, fails and says the given message', () => {
            const { runner, output } = buildRunner({
                constraints: { locations: {}, boolean: { started_quest: false } },
                customActions: { talk_to_priest: ['verify boolean started_quest true blocked_msg', 'say should_not_run'] },
                messages: { blocked_msg: 'Not yet.', should_not_run: 'This should not print.' },
                things: { priest: { alias: 'priest', description: 'a priest', location: 'plain', pickable: false } },
            });

            const result = runner.perform('talk_to', ['priest'], 'talk_to_priest', 'plain');

            expect(result).toEqual({ handled: true, gameOver: false });
            expect(output).toEqual(['Not yet.']);
        });

        test('without an explicit value, checks truthiness', () => {
            const { runner, output } = buildRunner({
                customActions: { some_alias: ['verify boolean given_flag', 'say passed'] },
                messages: { passed: 'Passed!' },
            });

            runner.perform('drink', [], 'some_alias', 'plain');

            expect(output).toEqual(['Passed!']);
        });
    });

    test('"set message" advances dialogue so the old key now shows the new key\'s text', () => {
        const { runner, messages, output } = buildRunner({
            customActions: { talk_to_priest: ['say talk_to_priest', 'set message talk_to_priest talk_to_priest_2', 'quiet'] },
            messages: { talk_to_priest: 'Hello traveler.', talk_to_priest_2: 'Welcome back.' },
            things: { priest: { alias: 'priest', description: 'a priest', location: 'plain', pickable: false } },
        });

        runner.perform('talk_to', ['priest'], 'talk_to_priest', 'plain');

        expect(output).toEqual(['Hello traveler.']);
        expect(messages.findByAlias('talk_to_priest')).toBe('Welcome back.');
    });

    test('"set description-thing" and "set description-location" update descriptions from a message key', () => {
        const { runner, game } = buildRunner({
            customActions: {
                use_rusty_sword_on_zombie: ['set description-thing zombie zombie_desc_2', 'set description-location plain plain_desc_2'],
            },
            messages: { zombie_desc_2: 'a defeated zombie', plain_desc_2: 'a quieter plain now' },
            things: { zombie: { alias: 'zombie', description: 'a zombie', location: 'plain', pickable: false } },
        });

        runner.perform('use', ['rusty_sword', 'zombie'], 'use_rusty_sword_on_zombie', 'plain');

        expect(game.things.zombie.description).toBe('a defeated zombie');
        expect(game.locations.plain.description).toBe('a quieter plain now');
    });

    test('"set constraint-boolean" updates the flag', () => {
        const { runner, constraints } = buildRunner({
            customActions: { some_alias: ['set constraint-boolean started_quest true'] },
            constraints: { locations: {}, boolean: { started_quest: false } },
        });

        runner.perform('drink', [], 'some_alias', 'plain');

        expect(constraints.boolean.started_quest).toBe(true);
    });

    test('"set constraint-location" blocks a direction, and "nil" unblocks it', () => {
        const { runner, constraints } = buildRunner({
            customActions: {
                lock_it: ['set constraint-location plain-n locked_msg'],
                unlock_it: ['set constraint-location plain-n nil'],
            },
            messages: { locked_msg: 'The way is locked.' },
        });

        runner.perform('drink', [], 'lock_it', 'plain');
        expect(constraints.locations['plain-n']).toBe('The way is locked.');

        runner.perform('drink', [], 'unlock_it', 'plain');
        expect(constraints.locations['plain-n']).toBeUndefined();
    });

    test('"remove" and "add" move a thing out of and into the inventory', () => {
        const { runner, game } = buildRunner({
            customActions: { some_alias: ['remove rusty_sword', 'add gemstone'] },
        });

        runner.perform('drink', [], 'some_alias', 'plain');

        expect(game.things.rusty_sword.location).toBeUndefined();
        expect(game.things.gemstone.location).toBe('i');
    });

    describe('the automatic command_alias message', () => {
        test('prints when every instruction succeeds', () => {
            const { runner, output } = buildRunner({
                customActions: { give_gemstone_to_wizard: ['remove gemstone'] },
                things: {
                    gemstone: { alias: 'gemstone', description: 'a gemstone', location: 'i', pickable: true },
                    wizard: { alias: 'wizard', description: 'a wizard', location: 'swamp', pickable: false },
                },
            });

            runner.perform('give', ['gemstone', 'wizard'], 'give_gemstone_to_wizard', 'swamp');

            expect(output).toEqual(['Wizard is happy.']);
        });

        test('"quiet" stops the script early and suppresses it', () => {
            const { runner, output } = buildRunner({
                customActions: { give_gemstone_to_wizard: ['say custom_line', 'quiet'] },
                messages: { custom_line: 'Custom.' },
                things: {
                    gemstone: { alias: 'gemstone', description: 'a gemstone', location: 'i', pickable: true },
                    wizard: { alias: 'wizard', description: 'a wizard', location: 'swamp', pickable: false },
                },
            });

            runner.perform('give', ['gemstone', 'wizard'], 'give_gemstone_to_wizard', 'swamp');

            expect(output).toEqual(['Custom.']);
        });
    });

    test('"exit" prints the alias message (fixing Ruby\'s silent Kernel#exit) and signals game over', () => {
        const { runner, output } = buildRunner({
            customActions: { use_shining_sword_on_grelok: ['exit'] },
            things: { shining_sword: { alias: 'shining_sword', description: 'a shining sword', location: 'i', pickable: true } },
        });

        const result = runner.perform('use', ['shining_sword', 'grelok'], 'use_shining_sword_on_grelok', 'mountain');

        expect(result).toEqual({ handled: true, gameOver: true });
        expect(output).toEqual(['Victory!']);
    });

    test('silently ignores an unrecognized instruction', () => {
        const { runner, output } = buildRunner({
            customActions: { some_alias: ['frobnicate foo', 'say passed'] },
            messages: { passed: 'Passed!' },
        });

        runner.perform('drink', [], 'some_alias', 'plain');

        expect(output).toEqual(['Passed!']);
    });

    test('throws on an unknown "verify" type', () => {
        const { runner } = buildRunner({ customActions: { some_alias: ['verify unknown_type foo'] } });
        expect(() => runner.perform('drink', [], 'some_alias', 'plain')).toThrow('Unknown "verify" type: unknown_type');
    });

    test('throws on an unknown "set" target', () => {
        const { runner } = buildRunner({ customActions: { some_alias: ['set unknown_target foo bar'] } });
        expect(() => runner.perform('drink', [], 'some_alias', 'plain')).toThrow('Unknown "set" target: unknown_target');
    });
});
