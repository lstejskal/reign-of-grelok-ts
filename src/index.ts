
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { toSentence, chopToLines } from './utils.js';
import { loadGameData } from './gameData/loadGameData.js';
import { Game } from './models/Game.js';

const version: string = '0.0.1';

const QUIT_COMMANDS = new Set(['quit', 'exit']);

async function main(): Promise<void> {
    // load game data before the main loop
    const gameData = loadGameData();
    const game = new Game(gameData);

    console.log('REIGN OF GRELOK', `v${version}`);

    /*
    console.log(
        chopToLines(
            toSentence(
                [ 'apple', 'sword', 'ladder'],
                { prepend: 'You carry ' }
            )
        )
    );
    */

    const readline = createInterface({ input, output, prompt: '> ' });

    readline.prompt();

    for await (const line of readline) {
        const command = line.trim().toLowerCase();

        if (QUIT_COMMANDS.has(command)) {
            console.log('Farewell.');
            break;
        }

        // TODO: parse the command against gameData.commands and act on
        // game.locations / game.things (Player hasn't been ported yet)

        console.log(`You said: "${line.trim()}"`);

        readline.prompt();
    }

    readline.close();

    process.exit(0);
}

main();
