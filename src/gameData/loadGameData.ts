
import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';

import { DYNAMIC_GAME_DATA_FILES, STATIC_GAME_DATA_FILES } from './gameDataFiles.js';
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
export const DEFAULT_GAME_DATA_DIR = path.join(process.cwd(), 'game-data');

function readYamlFile<T>(dir: string, filename: string): T {
    const filePath = path.join(dir, filename);
    const contents = fs.readFileSync(filePath, 'utf8');
    return loadYaml(contents) as T;
}

/**
 * Reads and parses every game-data/*.yml file synchronously. Meant to be
 * called once on startup, before the main loop starts, so the rest of the
 * program can assume game data is already in memory.
 *
 * Takes two directories rather than one so a save/load can mix them: the
 * "dynamic" files (locations/things/constraints/messages - the ones that
 * actually mutate during play) come from `dynamicDir`, while the "static"
 * ones (commands/customActions - authored once, never mutated) come from
 * `staticDir`, which defaults to whatever `dynamicDir` resolved to. That
 * default is what keeps every normal call (the real boot path, fixture-dir
 * tests) reading all 6 files from the one directory, same as before -
 * SaveStore.ts is the only caller that passes two different directories.
 */
export function loadGameData(
    dynamicDir: string = DEFAULT_GAME_DATA_DIR,
    staticDir: string = dynamicDir,
): GameData {
    return {
        locations: readYamlFile<Record<string, LocationData>>(dynamicDir, DYNAMIC_GAME_DATA_FILES.locations),
        things: readYamlFile<Record<string, ThingData>>(dynamicDir, DYNAMIC_GAME_DATA_FILES.things),
        constraints: readYamlFile<ConstraintsData>(dynamicDir, DYNAMIC_GAME_DATA_FILES.constraints),
        messages: readYamlFile<MessagesData>(dynamicDir, DYNAMIC_GAME_DATA_FILES.messages),
        commands: readYamlFile<CommandsData>(staticDir, STATIC_GAME_DATA_FILES.commands),
        customActions: readYamlFile<CustomActionsData>(staticDir, STATIC_GAME_DATA_FILES.customActions),
    };
}
