import { Message } from '../../models/Message';

describe('Message', () => {
    const messages = new Message({
        gibberish1: 'Mighty Grognak is confused by this gibberish.',
        talk_to_wizard: 'Wizard just stares at you.',
        talk_to_wizard_2: '"What?!" barks the wizard.',
    });

    test('findByAlias looks up message text', () => {
        expect(messages.findByAlias('gibberish1')).toBe('Mighty Grognak is confused by this gibberish.');
    });

    test('findByAlias returns undefined for an unknown key', () => {
        expect(messages.findByAlias('does_not_exist')).toBeUndefined();
    });

    test("replace makes oldAlias resolve to newAlias's current text", () => {
        expect(messages.findByAlias('talk_to_wizard')).toBe('Wizard just stares at you.');

        messages.replace('talk_to_wizard', 'talk_to_wizard_2');

        expect(messages.findByAlias('talk_to_wizard')).toBe('"What?!" barks the wizard.');
    });
});
