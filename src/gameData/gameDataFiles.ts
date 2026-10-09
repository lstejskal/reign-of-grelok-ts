
/**
 * Filenames for the two halves of `GameData` (see types.ts):
 *
 * - "dynamic": mutated during play (a thing moves, a description changes, a
 *   constraint flips, an NPC's dialogue advances). These are what a save
 *   needs to capture.
 * 
 * - "static": authored once, never mutated at runtime. A save never writes
 *   these - `loadGameData` re-reads them from the real `game-data/` dir
 *   when loading a save (see loadGameData.ts, SaveStore.ts).
 *
 * Kept as one shared source of truth so the loader and the save writer
 * can't silently drift apart on what files make up a `GameData`.
 */
export const DYNAMIC_GAME_DATA_FILES = {
    locations: 'locations.yml',
    things: 'things.yml',
    constraints: 'constraints.yml',
    messages: 'messages.yml',
} as const;

export const STATIC_GAME_DATA_FILES = {
    commands: 'commands.yml',
    customActions: 'custom_actions.yml',
} as const;
