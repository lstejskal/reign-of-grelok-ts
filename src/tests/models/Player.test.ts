import { Player } from '../../models/Player';
import type { GameData } from '../../gameData/types';

function buildGameData(): GameData {
    return {
        locations: {
            plain: {
                alias: 'plain',
                name: 'Plain',
                description: 'A wide plain.',
                directions: { n: 'mountain', s: 'town' },
            },
            mountain: {
                alias: 'mountain',
                name: 'Mountain',
                description: 'A cold, ashen mountain.',
                directions: { s: 'plain' },
            },
            town: {
                alias: 'town',
                name: 'Town',
                description: 'A small town.',
                directions: { n: 'plain' },
            },
        },
        things: {
            rusty_sword: {
                alias: 'rusty_sword',
                description: 'your trusty rusty sword',
                location: 'i',
                pickable: true,
            },
            pebble: {
                alias: 'pebble',
                description: 'a tiny pebble',
                location: 'plain',
                pickable: true,
            },
            standing_stone: {
                alias: 'standing_stone',
                description: 'a huge menhir',
                location: 'plain',
                pickable: false,
            },
            shiny_sword: {
                alias: 'shiny_sword',
                description: 'a shiny sword',
                location: 'plain',
                pickable: true,
            },
            grelok: {
                alias: 'grelok',
                description: 'Grelok the Gruesome spewing heresies',
                location: 'mountain',
                pickable: false,
            },
        },
        commands: {
            go_north: ['n', 'north'],
            go_south: ['s', 'south'],
            go_east: ['e', 'east'],
            go_west: ['w', 'west'],
            look_at: ['l', 'look', 'examine'],
            display_inventory: ['i', 'inv', 'inventory'],
            pick_up: ['p', 'pick', 't', 'take'],
            drop: ['d', 'drop'],
            give: ['g', 'give'],
            use: ['u', 'use'],
            attack: ['a', 'attack', 'slay'],
            talk_to: ['tt', 'talk'],
            ask: ['ask'],
            quit_game: ['quit', 'exit'],
        },
        constraints: {
            locations: { 'plain-s': 'The road to town is washed out.' },
            boolean: {},
        },
        customActions: { pick_up_pebble: ['remove pebble', 'say pebble_gone'] },
        messages: {
            gibberish1: 'Mighty Grognak is confused by this gibberish.',
            gibberish2: 'I do not understand what are you trying to do.',
            gibberish3: 'Sorry, I do not speak gibberish.',
            ask_grelok_about_anything: '"I don\'t have time for your silly questions, human!"',
            talk_to_grelok: '"Silence, mortal!"',
            pebble_gone: 'The pebble crumbles to dust.',
        },
    };
}

const GIBBERISH_MESSAGES = [
    'Mighty Grognak is confused by this gibberish.',
    'I do not understand what are you trying to do.',
    'Sorry, I do not speak gibberish.',
];

function buildPlayer() {
    const output: string[] = [];
    const player = new Player(buildGameData(), (text) => output.push(text));
    return { player, output };
}

describe('Player', () => {
    test('starts at "plain" with no active objects until lookAround runs', () => {
        const { player } = buildPlayer();
        expect(player.currentLocation).toBe('plain');
        expect(player.activeObjects).toEqual([]);
    });

    describe('lookAround', () => {
        test('describes the room once per location, then stays quiet', () => {
            const { player, output } = buildPlayer();

            player.lookAround();
            expect(output.some((line) => line.includes('Plain'))).toBe(true);
            const firstCallLines = output.length;

            output.length = 0;
            player.lookAround();
            expect(output).toEqual([]);
            void firstCallLines;
        });

        test('builds active objects from inventory + visible things here', () => {
            const { player } = buildPlayer();
            player.lookAround();
            expect(player.activeObjects.sort()).toEqual(['pebble', 'rusty sword', 'shiny sword', 'standing stone'].sort());
        });
    });

    describe('inventory', () => {
        test('lists things whose location is "i"', () => {
            const { player } = buildPlayer();
            expect(player.inventory()).toEqual(['rusty_sword']);
        });
    });

    describe('lookAt', () => {
        test('describes a visible thing here or in inventory', () => {
            const { player, output } = buildPlayer();
            player.lookAround();
            player.lookAt('pebble');
            expect(output[output.length - 1]).toBe("It's a tiny pebble.");
        });

        test('refuses to describe something not here', () => {
            const { player, output } = buildPlayer();
            player.lookAround();
            player.lookAt('grelok');
            expect(output[output.length - 1]).toBe("You can't see any grelok here.");
        });

        test('with no argument, forces a re-description on the next lookAround', () => {
            const { player, output } = buildPlayer();
            player.lookAround();
            output.length = 0;

            player.lookAt();
            player.lookAround();

            expect(output.some((line) => line.includes('Plain'))).toBe(true);
        });
    });

    describe('pickUp / drop', () => {
        test('picks up a pickable thing in the current location', () => {
            const { player, output } = buildPlayer();
            player.lookAround();
            player.pickUp('pebble');
            expect(output[output.length - 1]).toBe('You picked up pebble.');
            expect(player.inventory()).toContain('pebble');
        });

        test('refuses to pick up something already carried', () => {
            const { player, output } = buildPlayer();
            player.pickUp('rusty_sword');
            expect(output[output.length - 1]).toBe('You already carry rusty sword.');
        });

        test('refuses to pick up something not pickable', () => {
            const { player, output } = buildPlayer();
            player.pickUp('standing_stone');
            expect(output[output.length - 1]).toBe("You can't pick up standing stone.");
        });

        test('with no argument, asks what to pick up', () => {
            const { player, output } = buildPlayer();
            player.pickUp();
            expect(output[output.length - 1]).toBe('Pick up what?');
        });

        test('drops a carried thing in the current location', () => {
            const { player, output } = buildPlayer();
            player.drop('rusty_sword');
            expect(output[output.length - 1]).toBe('You dropped rusty sword.');
            expect(player.game.things.rusty_sword.location).toBe('plain');
        });

        test('refuses to drop something not carried', () => {
            const { player, output } = buildPlayer();
            player.drop('pebble');
            expect(output[output.length - 1]).toBe("You don't carry pebble.");
        });
    });

    describe('go', () => {
        test('moves to the destination when the way is open', () => {
            const { player } = buildPlayer();
            player.go('n');
            expect(player.currentLocation).toBe('mountain');
        });

        test('shows the constraint message when a direction is blocked', () => {
            const { player, output } = buildPlayer();
            player.go('s');
            expect(player.currentLocation).toBe('plain');
            expect(output[output.length - 1]).toBe('The road to town is washed out.');
        });

        test('falls back to a generic message with no exit that way', () => {
            const { player, output } = buildPlayer();
            player.go('e');
            expect(player.currentLocation).toBe('plain');
            expect(output[output.length - 1]).toBe("You can't go that way.");
        });
    });

    describe('talkTo / ask / give / use fallbacks', () => {
        test('talkTo an active object says it can\'t chat with that', () => {
            const { player, output } = buildPlayer();
            player.lookAround();
            player.talkTo('rusty_sword');
            expect(output[output.length - 1]).toBe("You can't chat with that.");
        });

        test('talkTo something not present asks who', () => {
            const { player, output } = buildPlayer();
            player.lookAround();
            player.talkTo('wizard');
            expect(output[output.length - 1]).toBe("Talk to whom? I don't see any wizard around here.");
        });

        test('ask looks up a message for an active object', () => {
            const { player, output } = buildPlayer();
            player.go('n'); // grelok is on the mountain
            player.lookAround();
            player.ask('grelok');
            expect(output[output.length - 1]).toBe('"I don\'t have time for your silly questions, human!"');
        });

        test('give with nothing specified is gibberish', () => {
            const { player, output } = buildPlayer();
            player.give();
            expect(GIBBERISH_MESSAGES).toContain(output[output.length - 1]);
        });

        test('use something not carried says so', () => {
            const { player, output } = buildPlayer();
            player.use('pebble');
            expect(output[output.length - 1]).toBe("You don't have pebble.");
        });
    });

    describe('displayInventory', () => {
        test('lists carried things', () => {
            const { player, output } = buildPlayer();
            player.displayInventory();
            expect(output[output.length - 1]).toBe('You carry rusty sword');
        });

        test('says so when empty', () => {
            const { player, output } = buildPlayer();
            player.drop('rusty_sword');
            output.length = 0;
            player.displayInventory();
            expect(output[output.length - 1]).toBe("You don't have anything.");
        });
    });

    test('quitGame says goodbye', () => {
        const { player, output } = buildPlayer();
        player.quitGame();
        expect(output[output.length - 1]).toBe('Farewell!');
    });

    describe('sayGibberish', () => {
        let randomSpy: jest.SpyInstance<number, []>;

        afterEach(() => {
            randomSpy.mockRestore();
        });

        test('picks the first gibberish variant at the low end of the range', () => {
            randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
            const { player, output } = buildPlayer();
            player.sayGibberish();
            expect(output[output.length - 1]).toBe(GIBBERISH_MESSAGES[0]);
        });

        test('picks the last gibberish variant at the high end of the range', () => {
            randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.999999);
            const { player, output } = buildPlayer();
            player.sayGibberish();
            expect(output[output.length - 1]).toBe(GIBBERISH_MESSAGES[2]);
        });

        test('always resolves to one of the known gibberish variants', () => {
            const { player, output } = buildPlayer();
            for (let i = 0; i < 20; i++) {
                player.sayGibberish();
            }
            output.forEach((line) => expect(GIBBERISH_MESSAGES).toContain(line));
        });
    });
    describe('processLine', () => {
        test('an empty line is a no-op', () => {
            const { player, output } = buildPlayer();
            const result = player.processLine('   ');
            expect(result).toEqual({ gameOver: false });
            expect(output).toEqual([]);
        });

        test('dispatches to a built-in handler (via the parser) when nothing else claims the command', () => {
            const { player } = buildPlayer();
            const result = player.processLine('n');
            expect(result).toEqual({ gameOver: false });
            expect(player.currentLocation).toBe('mountain');
        });

        test('a message takes priority over the built-in handler for the same alias', () => {
            const { player, output } = buildPlayer();
            player.go('n'); // grelok is on the mountain
            player.lookAround();

            player.processLine('talk to grelok');

            // the built-in talkTo() fallback would have said "You can't chat with that."
            expect(output[output.length - 1]).toBe('"Silence, mortal!"');
        });

        test('a custom action takes priority over both messages and built-in handlers', () => {
            const { player, output } = buildPlayer();
            player.lookAround();

            const result = player.processLine('take pebble');

            expect(result).toEqual({ gameOver: false });
            expect(output[output.length - 1]).toBe('The pebble crumbles to dust.');
            // the custom action removed it, rather than the built-in pickUp() carrying it
            expect(player.game.things.pebble.location).toBeUndefined();
            expect(player.inventory()).not.toContain('pebble');
        });

        test('flags ambiguity instead of guessing which active object was meant', () => {
            const { player, output } = buildPlayer();
            player.lookAround(); // active objects: rusty sword, pebble, standing stone, shiny sword

            const result = player.processLine('look at sword');

            expect(result).toEqual({ gameOver: false });
            expect(output[output.length - 1]).toBe('Which sword do you mean: rusty sword, shiny sword or something else?');
        });

        test('falls back to gibberish for an unrecognized command', () => {
            const { player, output } = buildPlayer();
            const result = player.processLine('xyzzy');
            expect(result).toEqual({ gameOver: false });
            expect(GIBBERISH_MESSAGES).toContain(output[output.length - 1]);
        });

        test('quit ends the game after saying goodbye', () => {
            const { player, output } = buildPlayer();
            const result = player.processLine('quit');
            expect(result).toEqual({ gameOver: true });
            expect(output[output.length - 1]).toBe('Farewell!');
        });
    });
});
