import { Texture2D } from '@luma.gl/core';
import { colorRampCanvas } from 'cpt2js';
import type { Scale } from 'cpt2js';
import GL from './gl.js';

export function createPaletteTexture(gl: WebGLRenderingContext, paletteScale: Scale): { paletteBounds: readonly [number, number], paletteTexture: Texture2D } {
  const paletteDomain = paletteScale.domain() as unknown as number[];
  const paletteBounds = [paletteDomain[0], paletteDomain[paletteDomain.length - 1]] as const;
  const paletteCanvas = colorRampCanvas(paletteScale);
  const paletteTexture = new Texture2D(gl, {
    data: paletteCanvas,
    parameters: {
      [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
      [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
      [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
      [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
    },
  });

  return { paletteBounds, paletteTexture };
}

export { parsePalette, colorRampCanvas } from 'cpt2js';
export type { Palette } from 'cpt2js';