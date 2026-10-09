
import { Location } from './Location.js';
import { Thing } from './Thing.js';
import type { GameData, CustomActionsData } from '../gameData/types.js';

/**
 * Holds the mutable game world state (locations, things, custom actions)
 */
export class Game {
    locations: Record<string, Location>;
    things: Record<string, Thing>;
    customActions: CustomActionsData;

    constructor(gameData: GameData) {
        this.locations = Game.loadLocations(gameData.locations);
        this.things = Game.loadThings(gameData.things);
        this.customActions = gameData.customActions;
    }

    // For save/load (src/persistence/SaveStore.ts via Player#loadGame):
    // replaces this instance's content *in place*, keeping its identity, 
    // so anyone already holding a reference to this Game (CustomActionRunner,
    // constructed once in Player's constructor) sees the loaded state too -
    // as opposed to Player swapping in a brand new `Game` object, which
    // CustomActionRunner would never see.
    reload(gameData: GameData): void {
        this.locations = Game.loadLocations(gameData.locations);
        this.things = Game.loadThings(gameData.things);
        this.customActions = gameData.customActions;
    }

    private static loadLocations(rawLocations: GameData['locations']): Record<string, Location> {
        const locations: Record<string, Location> = {};

        for (const [key, data] of Object.entries(rawLocations)) {
            locations[key] = new Location(data);
        }

        return locations;
    }

    private static loadThings(rawThings: GameData['things']): Record<string, Thing> {
        const things: Record<string, Thing> = {};

        for (const [key, data] of Object.entries(rawThings)) {
            things[key] = new Thing(data);
        }

        return things;
    }

    // For save/load (src/persistence/SaveStore.ts): the inverse of the constructor
    // `customActions` isstatic game content, passed through unchanged
    toData(): Pick<GameData, 'locations' | 'things' | 'customActions'> {
        return {
            locations: mapValues(this.locations, (location) => location.toLocationData()),
            things: mapValues(this.things, (thing) => thing.toData()),
            customActions: this.customActions,
        };
    }
}

function mapValues<T, R>(record: Record<string, T>, fn: (value: T) => R): Record<string, R> {
    const result: Record<string, R> = {};
    for (const [key, value] of Object.entries(record)) {
        result[key] = fn(value);
    }
    return result;
}
