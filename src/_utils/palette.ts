import type { Device, Texture } from '@luma.gl/core';
import { colorRampCanvas } from 'cpt2js';
import type { Scale } from 'cpt2js';

export function createPaletteTexture(device: Device, paletteScale: Scale): { paletteBounds: readonly [number, number], paletteTexture: Texture } {
  const paletteDomain = paletteScale.domain() as unknown as number[];
  const paletteBounds = [paletteDomain[0], paletteDomain[paletteDomain.length - 1]] as const;
  const paletteCanvas = colorRampCanvas(paletteScale);
  const paletteImage = document.createElement('img');
  paletteImage.src = paletteCanvas.toDataURL(); // TODO: change back to using canvas directly with luma.gl 9.1, see https://github.com/visgl/luma.gl/pull/1860
  const paletteTexture = device.createTexture({
    data: paletteImage,
    sampler: {
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    },
  });

  return { paletteBounds, paletteTexture };
}

export { parsePalette, colorRampCanvas } from 'cpt2js';
export type { Palette, Scale } from 'cpt2js';