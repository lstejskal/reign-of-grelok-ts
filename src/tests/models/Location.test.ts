import { Location } from '../../models/Location';

describe('Location', () => {
    test('name is the stored name, not derived from alias', () => {
        const plain = new Location({
            alias: 'plain',
            name: 'The Great Plain',
            description: 'A wide plain.',
            directions: { n: 'mountain' },
        });
        expect(plain.name).toBe('The Great Plain');
    });

    test('formattedDirections lists directions as a sentence', () => {
        const plain = new Location({
            alias: 'plain',
            name: 'Plain',
            description: 'A wide plain.',
            directions: { n: 'mountain', s: 'town', e: 'chapel', w: 'swamp' },
        });
        expect(plain.formattedDirections()).toBe('You can go north, south, east and west');
    });

    test('formattedDirections handles a single direction', () => {
        const town = new Location({
            alias: 'town',
            name: 'Town',
            description: 'A small town.',
            directions: { n: 'plain' },
        });
        expect(town.formattedDirections()).toBe('You can go north');
    });

    test('formattedDirections falls back to "nowhere" with no exits', () => {
        const trapped = new Location({
            alias: 'trapped',
            name: 'Trapped Room',
            description: 'No way out.',
            directions: {},
        });
        expect(trapped.formattedDirections()).toBe('You can go nowhere');
    });
});
