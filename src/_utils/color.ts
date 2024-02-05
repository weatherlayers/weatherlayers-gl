import type { Color } from '@deck.gl/core/typed';

export function deckColorToGl(color: Color): readonly [number, number, number, number] {
  return [color[0] / 255, color[1] / 255, color[2] / 255, (color[3] ?? 255) / 255] as const;
}

export function paletteColorToGl(color: readonly [number, number, number, number]): readonly [number, number, number, number] {
  return [color[0], color[1], color[2], color[3] * 255] as const;
}