import { completeLine } from '../../parser/Autocompleter';
import type { CommandsData } from '../../gameData/types';

const COMMANDS: CommandsData = {
    go_north: ['n', 'north'],
    go_south: ['s', 'south'],
    go_east: ['e', 'east'],
    go_west: ['w', 'west'],
    look_at: ['l', 'look', 'e', 'examine'],
    display_inventory: ['i', 'inv', 'inventory'],
    pick_up: ['p', 'pick', 't', 'take'],
    drop: ['d', 'drop'],
    save_game: ['save'],
    load_game: ['load', 'restore'],
    give: ['g', 'give'],
    use: ['u', 'use'],
    attack: ['a', 'attack', 'slay'],
    talk_to: ['tt', 'talk', 'talk to'],
    ask: ['ask'],
    quit_game: ['quit', 'exit'],
};

const ACTIVE_OBJECTS = ['rusty sword', 'zombie', 'blacksmith', 'gemstone shards'];

function complete(line: string, activeObjects: string[] = ACTIVE_OBJECTS): string | null {
    return completeLine(line, activeObjects, COMMANDS);
}

describe('completeLine', () => {
    test('completes a verb from its first letters', () => {
        expect(complete('at')).toBe('attack ');
    });

    test('picks the first matching alias in the data\'s own order when several match', () => {
        // 's' itself is go_south's alias, declared before 'south', 'save' and 'slay'.
        expect(complete('s')).toBe('s ');
    });

    test('completes a two-param verb\'s first object and auto-inserts the conjunction', () => {
        expect(complete('attack zo')).toBe('attack zombie with ');
    });

        test('completes the second object once the conjunction was already typed', () => {
        expect(complete('give rusty sword to bl')).toBe('give rusty sword to blacksmith ');
    });

    test('completes a multi-word second object from a partial word', () => {
        expect(complete('give rusty sword to gemstone sh')).toBe('give rusty sword to gemstone shards ');
    });

    test('completes a one-param verb\'s object, keeping a dropped preposition as typed', () => {
        expect(complete('look at ru')).toBe('look at rusty sword ');
    });

    test('completes a shortcut (last word) of a multi-word active object', () => {
        expect(complete('look at sw')).toBe('look at sword ');
    });

    test('returns null when nothing matches', () => {
        expect(complete('xyz')).toBeNull();
        expect(complete('attack xyz')).toBeNull();
    });

    test('returns null when the line ends in whitespace (nothing being typed)', () => {
        expect(complete('')).toBeNull();
        expect(complete('attack ')).toBeNull();
    });

    test('returns null past a zero-param verb', () => {
        expect(complete('quit xyz')).toBeNull();
    });
});
