
import type { MessagesData } from '../gameData/types.js';

/**
 * Message lookup class over game's message.
 * Enables mutation, used for NPC dialogue and quest progressions.
 */
export class Message {
    private readonly messages: MessagesData;

    // PS: this resets the state after loading game
    // otherwise player might see advanced NPC dialogue etc.
    constructor(messages: MessagesData) {
        this.messages = messages;
    }

    findByAlias(messageAlias: string): string | undefined {
        return this.messages[messageAlias];
    }

    // Makes `oldAlias` resolve to whatever text `newAlias` currently holds
    // used for example to advance NPC dialogue ("what the priest says" 
    // changes after you've heard their opening line)
    // check 'set message' in custom_action.yml
    replace(oldAlias: string, newAlias: string): void {
        this.messages[oldAlias] = this.messages[newAlias];
    }
}
