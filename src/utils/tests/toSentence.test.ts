import { toSentence } from '../toSentence';

describe('toSentence', () => {
    test('creates sentence out of array', () => {

        let arr = ['apple', 'sword', 'shield', 'horse'];
        expect(toSentence(arr, { prepend: 'You carry ', append: '.'})).toBe('You carry apple, sword, shield and horse.');

        arr = ['sword', 'shield'];
        expect(toSentence(arr)).toBe('sword and shield');

        arr = ['sword'];
        expect(toSentence(arr)).toBe('sword');
    });

    test('handles empty array', () => {
        expect(toSentence([])).toBe('nothing');
    });

})


