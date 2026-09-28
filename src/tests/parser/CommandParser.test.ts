import { parseCommand, isAmbiguous, ParsedCommand } from '../../parser/CommandParser';
import type { CommandsData } from '../../gameData/types';

const COMMANDS: CommandsData = {
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
};

function parse(line: string, activeObjects: string[] = []): ParsedCommand {
    const result = parseCommand(line, activeObjects, COMMANDS);
    if (isAmbiguous(result)) {
        throw new Error(`expected an unambiguous result but got: ${result.ambiguity}`);
    }
    return result;
}

describe('parseCommand', () => {
    test('look at rubble', () => {
        expect(parse('look at rubble')).toEqual({
            command: 'look_at',
            params: ['rubble'],
            commandAlias: 'look_at_rubble',
        });
    });

    test('attack zombie with rusty sword', () => {
        const result = parse('attack zombie with rusty sword', ['rusty sword']);
        expect(result).toEqual({
            command: 'use',
            params: ['rusty_sword', 'zombie'],
            commandAlias: 'use_rusty_sword_on_zombie',
        });
    });

    test('give gemstone shards to blacksmith', () => {
        const result = parse('give gemstone shards to blacksmith');
        expect(result).toEqual({
            command: 'give',
            params: ['gemstone_shards', 'blacksmith'],
            commandAlias: 'give_gemstone_shards_to_blacksmith',
        });
    });

    test('take shards resolves against the active gemstone shards', () => {
        const result = parse('take shards', ['gemstone shards']);
        expect(result).toEqual({
            command: 'pick_up',
            params: ['gemstone_shards'],
            commandAlias: 'pick_up_gemstone_shards',
        });
    });

    test('drink from jug (data-only verb, "from" is not a droppable preposition)', () => {
        const result = parse('drink from jug');
        expect(result).toEqual({
            command: 'drink',
            params: ['from_jug'],
            commandAlias: 'drink_from_jug',
        });
    });

    test('n is shorthand for go_north', () => {
        const result = parse('n');
        expect(result).toEqual({
            command: 'go',
            params: ['north'],
            commandAlias: 'go_north',
        });
    });

    test('i is shorthand for display_inventory with no params', () => {
        const result = parse('i');
        expect(result).toEqual({
            command: 'display_inventory',
            params: [],
            commandAlias: 'display_inventory_',
        });
    });

    test('ask npc about thing keeps only the npc as the alias target', () => {
        const result = parse('ask wizard about amulet');
        expect(result).toEqual({
            command: 'ask',
            params: ['wizard', 'amulet'],
            commandAlias: 'ask_wizard_about_amulet',
        });
    });

    test('drops a leading preposition after the verb', () => {
        expect(parse('pick up sword')).toEqual({
            command: 'pick_up',
            params: ['sword'],
            commandAlias: 'pick_up_sword',
        });

        expect(parse('talk to wizard')).toEqual({
            command: 'talk_to',
            params: ['wizard'],
            commandAlias: 'talk_to_wizard',
        });
    });

    test('a two-word active object typed without underscores is treated as one param', () => {
        const result = parse('put rusty sword', ['rusty sword']);
        expect(result).toEqual({
            command: 'put',
            params: ['rusty_sword'],
            commandAlias: 'put_rusty_sword',
        });
    });

    test('an exact active-object match is left as-is', () => {
        const result = parse('look at rusty sword', ['rusty sword']);
        expect(result).toEqual({
            command: 'look_at',
            params: ['rusty_sword'],
            commandAlias: 'look_at_rusty_sword',
        });
    });

    test('a param with no matching active object is left unchanged', () => {
        const result = parse('look at grelok', ['rusty sword']);
        expect(result).toEqual({
            command: 'look_at',
            params: ['grelok'],
            commandAlias: 'look_at_grelok',
        });
    });

    test('flags ambiguity when a partial name matches two active objects', () => {
        const result = parseCommand('look at sword', ['rusty sword', 'shiny sword'], COMMANDS);
        expect(isAmbiguous(result)).toBe(true);
        if (isAmbiguous(result)) {
            expect(result.ambiguity).toBe('Which sword do you mean: rusty sword, shiny sword or something else?');
        }
    });
});
