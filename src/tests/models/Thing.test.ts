import { Thing } from '../../models/Thing';

describe('Thing', () => {
    test('derives name from alias, replacing underscores with spaces', () => {
        const sword = new Thing({ alias: 'rusty_sword', description: 'a sword' });
        expect(sword.name).toBe('rusty sword');
    });

    test('defaults visible to true and pickable to false when omitted', () => {
        const thing = new Thing({ alias: 'grelok', description: 'an evil wizard' });
        expect(thing.visible).toBe(true);
        expect(thing.pickable).toBe(false);
    });

    test('respects explicit visible and pickable values', () => {
        const thing = new Thing({
            alias: 'gemstone',
            description: 'a gemstone',
            visible: false,
            pickable: true,
        });
        expect(thing.visible).toBe(false);
        expect(thing.pickable).toBe(true);
    });

    test('normalizes a null location (blank YAML value) to undefined', () => {
        const thing = new Thing({ alias: 'jug', description: 'a jug', location: null });
        expect(thing.location).toBeUndefined();
    });

    test('inLocation compares against the current location', () => {
        const thing = new Thing({ alias: 'pebble', description: 'a pebble', location: 'plain' });
        expect(thing.inLocation('plain')).toBe(true);
        expect(thing.inLocation('mountain')).toBe(false);
    });

    test('aliasToName replaces underscores with spaces', () => {
        expect(Thing.aliasToName('standing_stone')).toBe('standing stone');
        expect(Thing.aliasToName('grelok')).toBe('grelok');
    });
});
