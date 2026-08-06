
interface SentenceParams {
    join?: string;
    joinLast?: string;
    prepend?: string;
    append?: string;
    onEmpty?: string;
}

const DEFAULT_PARS: SentenceParams  = {
    join: ', ',
    joinLast: ' and ',
    prepend: '',
    append: '',
    onEmpty: 'nothing'
};

export function toSentence(arr: string[], pars?: SentenceParams): string {
    pars = { ...DEFAULT_PARS, ...pars };

    let sentence: string | undefined;
    switch (arr.length) {
        case 0:
            sentence = pars.onEmpty;
            break;
        case 1:
            sentence = arr[0];
            break;
        case 2:
            sentence =  arr.join(pars.joinLast);
            break;
        default:
            const lastItem = arr.pop();
            sentence = [arr.join(pars.join), lastItem].join(pars.joinLast);
        }

        return [pars.prepend, sentence, pars.append].join('')
}

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
