
import { toSentence, chopToLines } from './utils.js';

const version: string = '1.0.0';

console.log('REIGN OF GRELOK', `v${version}`);

console.log(
    chopToLines(
        toSentence(
            [ 'apple', 'sword', 'ladder'],
            { prepend: 'You carry ' }
        )
    )
);
