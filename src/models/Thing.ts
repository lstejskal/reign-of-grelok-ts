
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
}
