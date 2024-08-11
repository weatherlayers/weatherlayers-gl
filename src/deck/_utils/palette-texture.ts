import type { Device, Texture } from '@luma.gl/core';
import { colorRampCanvas } from '../../client/_utils/palette.js';
import type { Scale } from '../../client/_utils/palette.js';

export function createPaletteTexture(device: Device, paletteScale: Scale): { paletteBounds: readonly [number, number], paletteTexture: Texture } {
  const paletteDomain = paletteScale.domain() as unknown as number[];
  const paletteBounds = [paletteDomain[0], paletteDomain[paletteDomain.length - 1]] as const;
  const paletteCanvas = colorRampCanvas(paletteScale);
  const paletteTexture = device.createTexture({
    data: paletteCanvas as any, // TODO: remove any with luma.gl 9.1, see https://github.com/visgl/luma.gl/pull/1860
    sampler: {
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    },
  });

  return { paletteBounds, paletteTexture };
}