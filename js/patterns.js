function pattern(id, name, description, rows) {
  return { id, name, description, width: rows[0].length, height: rows.length,
    cells: rows.flatMap((row, y) => [...row].flatMap((cell, x) => cell === 'O' ? [[x, y]] : [])) };
}

export const patterns = [
  pattern('glider', 'Glider', 'Spaceship · diagonal traveler', ['.O.', '..O', 'OOO']),
  pattern('blinker', 'Blinker', 'Oscillator · period 2', ['OOO']),
  pattern('toad', 'Toad', 'Oscillator · period 2', ['.OOO', 'OOO.']),
  pattern('pulsar', 'Pulsar', 'Oscillator · period 3', [
    '..OOO...OOO..', '.............', 'O....O.O....O', 'O....O.O....O', 'O....O.O....O',
    '..OOO...OOO..', '.............', '..OOO...OOO..', 'O....O.O....O', 'O....O.O....O',
    'O....O.O....O', '.............', '..OOO...OOO..'
  ]),
  pattern('lwss', 'Lightweight spaceship', 'Spaceship · horizontal traveler', ['.O..O', 'O....', 'O...O', 'OOOO.'])
];

export function previewSVG(pattern) {
  const side = Math.max(pattern.width, pattern.height) + 2;
  const dx = (side - pattern.width) / 2;
  const dy = (side - pattern.height) / 2;
  return `<svg class="pattern-preview" viewBox="0 0 ${side} ${side}" aria-hidden="true">${pattern.cells.map(([x, y]) => `<rect x="${x + dx}" y="${y + dy}" width=".8" height=".8" rx=".08"/>`).join('')}</svg>`;
}
