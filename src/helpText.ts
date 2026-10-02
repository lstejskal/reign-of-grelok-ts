
/**
 * Static help screen for the "h"/"help" command.
 * Content mirrors README.md's "Commands", "Notes" and "System commands".
 */
export const HELP_LINES: string[] = [
    'Commands:',
    '  movement: n(orth), s(outh), e(ast), w(est)',
    '  inventory: i(nventory)',
    '  look at thing: e(xamine), l(ook at) [thing]',
    '  pick up thing: t(ake), p(ick up) [thing]',
    '  drop thing: d(rop) [thing]',
    '  give thing: give [thing] to [npc]',
    '  use thing: use [thing] on [thing|npc|monster]',
    '  fight: attack [npc|monster] with [thing]',
    '  communication: talk to (tt) [npc], ask [npc] about [thing]',
    '',
    'Notes:',
    '  l(ook) - look around: show location, directions and objects',
    '  "use sword on zombie" has the same effect as "attack zombie with sword"',
    '',
    'System commands:',
    '  extended prompt on/off',
    '  save [name]',
    '  load [name]',
    '  quit/exit',
];
