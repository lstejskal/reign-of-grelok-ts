import { Message } from '../../models/Message';

describe('Message', () => {
    test('findByAlias looks up message text', () => {
        const messages = new Message({ gibberish1: 'Mighty Grognak is confused by this gibberish.' });
        expect(messages.findByAlias('gibberish1')).toBe('Mighty Grognak is confused by this gibberish.');
    });

    test('findByAlias returns undefined for an unknown key', () => {
        const messages = new Message({ gibberish1: 'huh?' });
        expect(messages.findByAlias('does_not_exist')).toBeUndefined();
    });

    test("replace makes oldAlias resolve to newAlias's current text", () => {
        const messages = new Message({
            talk_to_priest: 'Priest smiles at you.',
            talk_to_priest_2: 'Please hurry.',
        });

        messages.replace('talk_to_priest', 'talk_to_priest_2');

        expect(messages.findByAlias('talk_to_priest')).toBe('Please hurry.');
        // newAlias itself is untouched
        expect(messages.findByAlias('talk_to_priest_2')).toBe('Please hurry.');
    });
});
