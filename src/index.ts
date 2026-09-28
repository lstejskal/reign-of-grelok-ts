
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { loadGameData } from './gameData/loadGameData.js';
import { Player } from './models/Player.js';

const version: string = '0.0.1';

async function main(): Promise<void> {
    // load game data before the main loop
    const gameData = loadGameData();
    const player = new Player(gameData);

    console.log('REIGN OF GRELOK', `v${version}`);

    const readline = createInterface({ input, output, prompt: '> ' });

    player.lookAround();
    readline.setPrompt(player.promptText);
    readline.prompt();

    for await (const line of readline) {
        const { gameOver } = player.processLine(line);

        if (gameOver) {
            break;
        }

        player.lookAround();
        readline.setPrompt(player.promptText);
        readline.prompt();
    }

    readline.close();

    process.exit(0);
}

main();
