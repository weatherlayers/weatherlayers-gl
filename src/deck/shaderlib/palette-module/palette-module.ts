import type { Texture } from '@luma.gl/core';
import type { ShaderModule } from '@luma.gl/shadertools';
import { sourceCode, tokens } from './palette-module.glsl';

export type PaletteModuleProps = {
  paletteTexture: Texture;
  paletteBounds: [number, number];
  paletteColor: [number, number, number, number];
};

export type PaletteModuleUniforms = {[K in keyof typeof tokens]: any};

export const paletteModule = {
  name: 'palette',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens.paletteBounds]: 'vec2<f32>',
    [tokens.paletteColor]: 'vec4<f32>',
  },
} as const satisfies ShaderModule<PaletteModuleUniforms>;

export function getPaletteModuleUniforms(props: PaletteModuleProps): {[paletteModule.name]: PaletteModuleUniforms} {
  return {
    [paletteModule.name]: {
      [tokens.paletteTexture]: props.paletteTexture,
      [tokens.paletteBounds]: props.paletteBounds,
      [tokens.paletteColor]: props.paletteColor,
    },
  };
}