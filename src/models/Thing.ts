
import type { ThingData } from '../gameData/types.js';

/**
 * Base class for game objects: items, locations, NPCs, obstacles...
 */
export interface ThingAttributes {
    alias: string;
    description: string;
    location?: string | null;
    visible?: boolean;
    pickable?: boolean;
}

export class Thing {
    alias: string;
    description: string;
    location?: string;
    visible: boolean;
    pickable: boolean;

    constructor(attrs: ThingAttributes) {
        this.alias = attrs.alias;
        this.description = attrs.description;
        this.location = attrs.location ?? undefined;
        this.visible = attrs.visible ?? true;
        this.pickable = attrs.pickable ?? false;
    }

    get name(): string {
        return Thing.aliasToName(this.alias);
    }

    inLocation(locationAlias: string): boolean {
        return this.location === locationAlias;
    }

    static aliasToName(thingAlias: string): string {
        return thingAlias.replace(/_/g, ' ');
    }

    // For save/load (src/persistence/SaveStore.ts): the inverse of the
    // constructor, so a mutated-at-runtime Thing round-trips back to the
    // plain data shape that `things.yml` is made of.
    toData(): ThingData {
        return {
            alias: this.alias,
            description: this.description,
            location: this.location,
            visible: this.visible,
            pickable: this.pickable,
        };
    }
}
