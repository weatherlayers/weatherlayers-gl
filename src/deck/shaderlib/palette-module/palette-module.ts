import type {Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {Color} from '@deck.gl/core';
import {deckColorToGl} from '../../_utils/color.js';
import {sourceCode, tokens} from './palette-module.glsl';

export type PaletteModuleProps = {
  paletteTexture?: Texture;
  paletteBounds?: [number, number];
  paletteColor?: Color | null;
};

type PaletteModuleUniforms = {[K in keyof typeof tokens]: any};

function getUniforms(props: Partial<PaletteModuleProps> = {}): PaletteModuleUniforms {
  return {
    [tokens.paletteTexture]: props.paletteTexture,
    [tokens.paletteBounds]: props.paletteBounds ?? [0, 0],
    [tokens.paletteColor]: props.paletteColor ? deckColorToGl(props.paletteColor) : [0, 0, 0, 0],
  };
}

export const paletteModule = {
  name: 'palette',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens.paletteBounds]: 'vec2<f32>',
    [tokens.paletteColor]: 'vec4<f32>',
  },
  getUniforms,
} as const satisfies ShaderModule<PaletteModuleProps, PaletteModuleUniforms>;