
import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';

import type {
    GameData,
    LocationData,
    ThingData,
    ConstraintsData,
    CommandsData,
    CustomActionsData,
    MessagesData,
} from './types.js';

// PS: game is always started from the project root (`npm start` 
// or jest's own rootDir), so cwd is reliable
const DEFAULT_GAME_DATA_DIR = path.join(process.cwd(), 'game-data');

function readYamlFile<T>(dir: string, filename: string): T {
    const filePath = path.join(dir, filename);
    const contents = fs.readFileSync(filePath, 'utf8');
    return loadYaml(contents) as T;
}

/**
 * Reads and parses every game-data/*.yml file synchronously. Meant to be
 * called once on startup, before the main loop starts, so the rest of the
 * program can assume game data is already in memory.
 */
export function loadGameData(gameDataDir: string = DEFAULT_GAME_DATA_DIR): GameData {
    return {
        locations: readYamlFile<Record<string, LocationData>>(gameDataDir, 'locations.yml'),
        things: readYamlFile<Record<string, ThingData>>(gameDataDir, 'things.yml'),
        commands: readYamlFile<CommandsData>(gameDataDir, 'commands.yml'),
        constraints: readYamlFile<ConstraintsData>(gameDataDir, 'constraints.yml'),
        customActions: readYamlFile<CustomActionsData>(gameDataDir, 'custom_actions.yml'),
        messages: readYamlFile<MessagesData>(gameDataDir, 'messages.yml'),
    };
}
