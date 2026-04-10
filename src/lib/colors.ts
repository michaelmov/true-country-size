const PALETTE = [
  '#E63946',
  '#2A9D8F',
  '#E9C46A',
  '#F4A261',
  '#A8DADC',
  '#457B9D',
  '#6A4C93',
  '#1982C4',
  '#FF595E',
  '#8AC926',
];

let colorIndex = 0;

export function getNextColor(): string {
  const color = PALETTE[colorIndex % PALETTE.length];
  colorIndex++;
  return color;
}

export function resetColorIndex() {
  colorIndex = 0;
}
