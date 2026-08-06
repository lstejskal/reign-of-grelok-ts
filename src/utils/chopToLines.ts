
export function chopToLines(str: string, maxWidth: number = 70): string {
    const words = str.split(/ +/);
    const lines: string[] = [];

    let line = '';
    for (const word of words) {
        if (line.length >= maxWidth) {
            lines.push(line);
            line = '';
        }

        line += ` ${word}`;
    }

    if (line !== '') {
        lines.push(line);
    }

    return lines.map(l => l.trimStart()).join('\n');
}
