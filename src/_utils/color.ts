import type { Color } from '@deck.gl/core/typed';

export function colorToGl(color: Color): Color {
  return [color[0] / 255, color[1] / 255, color[2] / 255, (color[3] ?? 255) / 255];
}