import { chopToLines } from '../chopToLines';

describe('chopToLines', () => {
    test('leaves short strings on one line', () => {
        expect(chopToLines('I got the power!')).toBe('I got the power!');
    });

    test('wraps at the given max width', () => {
        const str = 'this is a longer sentence that should wrap across multiple lines when given a small width';
        const result = chopToLines(str, 20);

        const lines = result.split('\n');
        expect(lines.length).toBeGreaterThan(1);
        lines.forEach(line => {
            expect(line).toBe(line.trimStart());
        });
        expect(lines.join(' ').replace(/\s+/g, ' ')).toBe(str);
    });

    test('defaults to width of 70', () => {
        const word = 'x'.repeat(10);
        const str = Array(10).fill(word).join(' ');
        expect(chopToLines(str)).toBe(chopToLines(str, 70));
    });

    test('handles empty string', () => {
        expect(chopToLines('')).toBe('');
    });

    test('handles a single word', () => {
        expect(chopToLines('hello')).toBe('hello');
    });
});
