
import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml, dump as dumpYaml } from 'js-yaml';

import { loadGameData, DEFAULT_GAME_DATA_DIR } from '../gameData/loadGameData.js';
import { DYNAMIC_GAME_DATA_FILES } from '../gameData/gameDataFiles.js';
import type { GameData } from '../gameData/types.js';

/**
 * Everything a save needs to restore a game, beyond what `GameData` itself
 * carries: `currentLocation` is live Player state, not game content.
 */
export interface SaveSnapshot {
    gameData: GameData;
    currentLocation: string;
}

export interface SaveStore {
    save(name: string, snapshot: SaveSnapshot): void;
    // undefined means "no save by that name", as opposed to an empty one.
    load(name: string): SaveSnapshot | undefined;
    list(): string[];
    nextFreeName(): string;
}

const PLAYER_STATE_FILE = 'player.yml';
const SAVE_NAME_PATTERN = /^save(\d{3})$/;

interface PlayerStateData {
    currentLocation: string;
}

/**
 * Stores each save in its own directory of YAML files under `baseDir`:
 * 
 * the 4 DYNAMIC_GAME_DATA_FILES plus a small `player.yml`
 * `currentLocation`. `commands.yml`/`custom_actions.yml` are not written here.
 * They never change at runtime, so `load()` re-reads them from the `game-data/`
 */
export class FileSaveStore implements SaveStore {
    constructor(private readonly baseDir: string) {}

    save(name: string, snapshot: SaveSnapshot): void {
        const dir = path.join(this.baseDir, name);
        fs.mkdirSync(dir, { recursive: true });

        for (const [key, filename] of Object.entries(DYNAMIC_GAME_DATA_FILES)) {
            this.writeYamlFile(dir, filename, snapshot.gameData[key as keyof GameData]);
        }

        const playerState: PlayerStateData = { currentLocation: snapshot.currentLocation };
        this.writeYamlFile(dir, PLAYER_STATE_FILE, playerState);
    }

    load(name: string): SaveSnapshot | undefined {
        const dir = path.join(this.baseDir, name);
        if (!fs.existsSync(dir)) {
            return undefined;
        }

        const gameData = loadGameData(dir, DEFAULT_GAME_DATA_DIR);
        const playerState = this.readYamlFile<PlayerStateData>(dir, PLAYER_STATE_FILE);

        return { gameData, currentLocation: playerState.currentLocation };
    }

    list(): string[] {
        if (!fs.existsSync(this.baseDir)) {
            return [];
        }

        return fs
            .readdirSync(this.baseDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);
    }

    // "save001", "save002", ... - the first unused number.
    nextFreeName(): string {
        const usedNumbers = new Set(
            this.list()
                .map((name) => name.match(SAVE_NAME_PATTERN))
                .filter((match): match is RegExpMatchArray => match !== null)
                .map((match) => Number(match[1])),
        );

        let candidate = 1;
        while (usedNumbers.has(candidate)) {
            candidate += 1;
        }

        return `save${String(candidate).padStart(3, '0')}`;
    }

    private writeYamlFile(dir: string, filename: string, data: unknown): void {
        fs.writeFileSync(path.join(dir, filename), dumpYaml(data), 'utf8');
    }

    private readYamlFile<T>(dir: string, filename: string): T {
        return loadYaml(fs.readFileSync(path.join(dir, filename), 'utf8')) as T;
    }
}
