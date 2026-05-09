
import { toSentence } from './utils/toSentence.js'; 

const version: string = '1.0.0';

console.log('REIGN OF GRELOK', `v${version}`);

console.log(
    toSentence(
        [ 'apple', 'sword', 'ladder'],
        { prepend: 'You carry ' }
    )
);
