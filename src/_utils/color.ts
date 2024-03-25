import type { Color } from '@deck.gl/core';

export function deckColorToGl(color: Color): [number, number, number, number] {
  return [color[0] / 255, color[1] / 255, color[2] / 255, (color[3] ?? 255) / 255] as const;
}

export function paletteColorToGl(color: [number, number, number, number]): [number, number, number, number] {
  return [color[0], color[1], color[2], color[3] * 255] as const;
}