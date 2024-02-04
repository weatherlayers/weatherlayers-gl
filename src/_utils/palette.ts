import { Texture2D } from '@luma.gl/core';
import { parsePalette, colorRampCanvas } from 'cpt2js';
import type { Palette } from 'cpt2js';
import GL from './gl.js';

export function createPaletteTexture(gl: WebGLRenderingContext, palette: Palette): { paletteBounds: readonly [number, number], paletteTexture: Texture2D } {
  const paletteScale = parsePalette(palette);
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