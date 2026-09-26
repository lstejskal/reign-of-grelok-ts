import path from 'node:path';

import { loadGameData } from '../../gameData/loadGameData';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('loadGameData', () => {
    const gameData = loadGameData(FIXTURES_DIR);

    test('loads locations as-is', () => {
        expect(gameData.locations.plain).toEqual({
            alias: 'plain',
            name: 'Plain',
            description: 'A wide plain.',
            directions: { n: 'mountain' },
        });
    });

    test('loads things with real YAML booleans as-is', () => {
        expect(gameData.things.rusty_sword.pickable).toBe(true);
        expect(gameData.things.rusty_sword.visible).toBeUndefined(); // not set in the data

        expect(gameData.things.gemstone.visible).toBe(false);
        expect(gameData.things.gemstone.pickable).toBe(true);

        expect(gameData.things.standing_stone.pickable).toBe(false);
    });

    test('keeps a set location string as given', () => {
        expect(gameData.things.standing_stone.location).toBe('plain');
    });

    test('an unset location comes through as null, not undefined', () => {
        // A known rough edge: `location:` with no value parses as `null` in
        // YAML, but ThingData types `location` as `string | undefined`.
        expect(gameData.things.jug.location).toBeNull();
    });

    test('loads commands as arrays of aliases', () => {
        expect(gameData.commands.go_north).toEqual(['n', 'north']);
    });

    test('loads constraint booleans as real booleans', () => {
        expect(gameData.constraints.boolean.given_quest_holy_water).toBe(false);
        expect(gameData.constraints.boolean.zombie_blocks_chapel_door).toBe(true);
        expect(gameData.constraints.locations['chapel-e']).toBe('Chapel door is blocked by zombie.');
    });

    test('loads custom actions and messages', () => {
        expect(gameData.customActions.give_gemstone_to_wizard).toEqual([
            'remove gemstone',
            'visible gemstone_shards',
        ]);
        expect(gameData.messages.gibberish1).toBe('Mighty Grognak is confused by this gibberish.');
    });

    test('defaults to the real game-data directory when called with no args', () => {
        const realGameData = loadGameData();
        expect(Object.keys(realGameData.locations).length).toBeGreaterThan(0);
        expect(realGameData.things.rusty_sword.pickable).toBe(true);
    });
});
