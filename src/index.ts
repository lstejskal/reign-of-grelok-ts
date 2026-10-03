
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { loadGameData } from './gameData/loadGameData.js';
import { Player } from './models/Player.js';
import { completeLine } from './parser/Autocompleter.js';

const version: string = '0.0.1';

async function main(): Promise<void> {
    // load game data before the main loop
    const gameData = loadGameData();
    const player = new Player(gameData);

    console.log('REIGN OF GRELOK', `v${version}`);

    const readline = createInterface({
        input,
        output,
        prompt: '> ',
        // Tab autocompletion: always resolves to at most one candidate (the first
        // match in the data's own order), so readline auto-inserts it immediately
        // instead of showing a list
        completer: (line: string): [string[], string] => {
            const completed = completeLine(line, player.activeObjects, player.commands);
            return completed === null ? [[], line] : [[completed], line];
        },
    });

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
