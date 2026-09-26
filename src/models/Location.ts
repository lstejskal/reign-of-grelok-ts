
import { Thing } from './Thing.js';
import { toSentence } from '../utils.js';

/**
 * Location is a Thing (sic!) with a set of `directions` to other locations. 
 * 
 * Note: it does NOT contain the things that are in it — a thing's own `location`
 * attribute points there.
 */
export interface LocationAttributes {
    alias: string;
    name: string;
    description: string;
    directions: Record<string, string>;
}

export class Location extends Thing {
    directions: Record<string, string>;

    private readonly locationName: string;

    static readonly DIRECTION_SHORTCUTS: Record<string, string> = {
        n: 'north',
        s: 'south',
        e: 'east',
        w: 'west',
    };

    constructor(attrs: LocationAttributes) {
        super({ alias: attrs.alias, description: attrs.description });
        this.locationName = attrs.name;
        this.directions = attrs.directions;
    }

    override get name(): string {
        return this.locationName;
    }

    // e.g. "You can go north, south and east" / "You can go nowhere"
    formattedDirections(): string {
        const directionNames = Object.keys(this.directions).map(
            (key) => Location.DIRECTION_SHORTCUTS[key] ?? key,
        );

        return toSentence(directionNames, { prepend: 'You can go ', onEmpty: 'nowhere' });
    }
}
