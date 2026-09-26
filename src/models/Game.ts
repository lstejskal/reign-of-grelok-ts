
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
}
