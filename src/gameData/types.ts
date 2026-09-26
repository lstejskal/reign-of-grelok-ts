
export interface LocationData {
    alias: string;
    name: string;
    description: string;
    directions: Record<string, string>;
}

export interface ThingData {
    alias: string;
    description: string;
    location?: string;
    pickable: boolean;
    // Not every entry sets this in game-data/things.yml (defaulting the
    // missing case to visible is still TODO).
    visible?: boolean;
}

export interface ConstraintsData {
    locations: Record<string, string>;
    boolean: Record<string, boolean>;
}

export type CommandsData = Record<string, string[]>;

export type CustomActionsData = Record<string, string[]>;

export type MessagesData = Record<string, string>;

export interface GameData {
    locations: Record<string, LocationData>;
    things: Record<string, ThingData>;
    commands: CommandsData;
    constraints: ConstraintsData;
    customActions: CustomActionsData;
    messages: MessagesData;
}
