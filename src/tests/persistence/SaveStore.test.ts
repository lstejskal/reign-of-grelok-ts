import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { FileSaveStore } from '../../persistence/SaveStore';
import { loadGameData } from '../../gameData/loadGameData';
import type { GameData } from '../../gameData/types';

function buildGameData(): GameData {
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
                visible: true,
            },
        },
        // Deliberately different from the real game-data/commands.yml, so
        // the "loaded commands/customActions come from the real game-data
        // dir, not the save" test below can tell the two apart.
        commands: { fake_command: ['fake'] },
        constraints: {
            locations: { 'plain-n': 'blocked' },
            boolean: { some_flag: true },
        },
        customActions: { fake_action: ['exit'] },
        messages: { gibberish1: '"..."' },
    };
}

describe('FileSaveStore', () => {
    let baseDir: string;
    let store: FileSaveStore;

    beforeEach(() => {
        baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grelok-saves-'));
        store = new FileSaveStore(baseDir);
    });

    afterEach(() => {
        fs.rmSync(baseDir, { recursive: true, force: true });
    });

    test('round-trips the dynamic game data and currentLocation', () => {
        const gameData = buildGameData();
        store.save('save001', { gameData, currentLocation: 'mountain' });

        const loaded = store.load('save001');

        expect(loaded?.currentLocation).toBe('mountain');
        expect(loaded?.gameData.locations).toEqual(gameData.locations);
        expect(loaded?.gameData.things).toEqual(gameData.things);
        expect(loaded?.gameData.constraints).toEqual(gameData.constraints);
        expect(loaded?.gameData.messages).toEqual(gameData.messages);
    });

    test('does not write commands.yml or custom_actions.yml into the save', () => {
        store.save('save001', { gameData: buildGameData(), currentLocation: 'plain' });

        const files = fs.readdirSync(path.join(baseDir, 'save001'));

        expect(files).not.toContain('commands.yml');
        expect(files).not.toContain('custom_actions.yml');
    });

    test('loads commands/customActions from the real game-data dir, not the save', () => {
        store.save('save001', { gameData: buildGameData(), currentLocation: 'plain' });

        const loaded = store.load('save001');
        const real = loadGameData();

        // Not the fixture's deliberately-different fake_command/fake_action.
        expect(loaded?.gameData.commands).toEqual(real.commands);
        expect(loaded?.gameData.customActions).toEqual(real.customActions);
    });

    test('load returns undefined for a save that does not exist', () => {
        expect(store.load('nope')).toBeUndefined();
    });

    test('list is empty when nothing has been saved yet', () => {
        expect(store.list()).toEqual([]);
    });

    test('list returns every saved name', () => {
        store.save('save001', { gameData: buildGameData(), currentLocation: 'plain' });
        store.save('my-save', { gameData: buildGameData(), currentLocation: 'plain' });

        expect(store.list().sort()).toEqual(['my-save', 'save001']);
    });

    test('nextFreeName starts at save001 and fills the first gap', () => {
        expect(store.nextFreeName()).toBe('save001');

        store.save('save001', { gameData: buildGameData(), currentLocation: 'plain' });
        store.save('save003', { gameData: buildGameData(), currentLocation: 'plain' });

        expect(store.nextFreeName()).toBe('save002');
    });
});
