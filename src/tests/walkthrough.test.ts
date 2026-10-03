import fs from 'node:fs';
import path from 'node:path';

import { Player } from '../models/Player';
import { loadGameData } from '../gameData/loadGameData';

const WALKTHROUGH_PATH = path.join(process.cwd(), 'walkthrough.txt');

function readWalkthroughCommands(): string[] {
    return fs
        .readFileSync(WALKTHROUGH_PATH, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
}

describe('walkthrough', () => {
    test('the shortest winning command sequence ends in victory', () => {
        const output: string[] = [];
        const player = new Player(loadGameData(), (text) => output.push(text));
        const commands = readWalkthroughCommands();

        // Fails loudly if the file is ever empty (wrong file?)
        expect(commands.length).toBeGreaterThan(0);

        // look around once up front and then again after every command,
        // so `activeObjects` stays current for the next line's parsing.
        player.lookAround();

        let gameOver = false;
        for (const command of commands) {
            const result = player.processLine(command);
            gameOver = result.gameOver;

            if (gameOver) {
                break;
            }

            player.lookAround();
        }

        // besides `gameOver`, check for the victory text itself
        expect(gameOver).toBe(true);
        expect(output.some((line) => line.includes('victory is yours!'))).toBe(true);
        expect(output.some((line) => line.includes('THE END'))).toBe(true);
    });
});
