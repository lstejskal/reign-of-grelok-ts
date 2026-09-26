
import { toSentence, chopToLines } from './utils.js';
import { loadGameData } from './gameData/loadGameData.js';

// load game data before the main loop
const gameData = loadGameData();

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

// TODO: main loop
