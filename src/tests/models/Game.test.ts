import { Game } from '../../models/Game';
import { Location } from '../../models/Location';
import { Thing } from '../../models/Thing';
import type { GameData } from '../../gameData/types';

function buildGameData(overrides: Partial<GameData> = {}): GameData {
    return {
        locations: {
            plain: {
                alias: 'plain',
                name: 'Plain',
                description: 'A wide plain.',
                directions: { n: 'mountain' },
            },
        },
        things: {
            rusty_sword: {
                alias: 'rusty_sword',
                description: 'your trusty rusty sword',
                location: 'i',
                pickable: true,
            },
            gemstone: {
                alias: 'gemstone',
                description: 'a gemstone',
                location: 'mountain',
                pickable: true,
                // visible intentionally omitted, like most things.yml entries
            },
        },
        commands: { go_north: ['n', 'north'] },
        constraints: { locations: {}, boolean: {} },
        customActions: { give_gemstone_to_wizard: ['remove gemstone'] },
        messages: { gibberish1: 'Mighty Grognak is confused by this gibberish.' },
        ...overrides,
    };
}

describe('Game', () => {
    test('builds Location instances keyed by alias', () => {
        const game = new Game(buildGameData());

        expect(game.locations.plain).toBeInstanceOf(Location);
        expect(game.locations.plain.name).toBe('Plain');
        expect(game.locations.plain.formattedDirections()).toBe('You can go north');
    });

    test('builds Thing instances keyed by alias', () => {
        const game = new Game(buildGameData());

        expect(game.things.rusty_sword).toBeInstanceOf(Thing);
        expect(game.things.rusty_sword.name).toBe('rusty sword');
        expect(game.things.rusty_sword.location).toBe('i');
    });

    test('things default to visible when things.yml omits it', () => {
        const game = new Game(buildGameData());
        expect(game.things.gemstone.visible).toBe(true);
    });

    test('passes custom actions through unchanged', () => {
        const game = new Game(buildGameData());
        expect(game.customActions).toEqual({ give_gemstone_to_wizard: ['remove gemstone'] });
    });
});
