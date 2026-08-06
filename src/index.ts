
import { toSentence } from './utils/toSentence.js'; 
import { chopToLines } from './utils/chopToLines.js'; 

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
