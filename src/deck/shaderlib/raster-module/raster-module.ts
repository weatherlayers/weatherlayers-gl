import type {Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {sourceCode, tokens} from './raster-module.glsl';

export type RasterModuleProps = {
  imageTexture: Texture;
  imageTexture2: Texture;
  imageResolution: [number, number];
  imageSmoothing: number;
  imageInterpolation: number;
  imageWeight: number;
  imageType: number;
  imageUnscale: [number, number];
  imageMinValue: number;
  imageMaxValue: number;
};

export type RasterModuleUniforms = {[K in keyof typeof tokens]: any};

export const rasterModule = {
  name: 'raster',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens.imageResolution]: 'vec2<f32>',
    [tokens.imageSmoothing]: 'f32',
    [tokens.imageInterpolation]: 'f32',
    [tokens.imageWeight]: 'f32',
    [tokens.imageType]: 'f32',
    [tokens.imageUnscale]: 'vec2<f32>',
    [tokens.imageMinValue]: 'f32',
    [tokens.imageMaxValue]: 'f32',
  },
} as const satisfies ShaderModule<RasterModuleUniforms>;

export function getRasterModuleUniforms(props: RasterModuleProps): RasterModuleUniforms {
  return {
    [tokens.imageTexture]: props.imageTexture,
    [tokens.imageTexture2]: props.imageTexture2,
    [tokens.imageResolution]: props.imageResolution,
    [tokens.imageSmoothing]: props.imageSmoothing,
    [tokens.imageInterpolation]: props.imageInterpolation,
    [tokens.imageWeight]: props.imageWeight,
    [tokens.imageType]: props.imageType,
    [tokens.imageUnscale]: props.imageUnscale,
    [tokens.imageMinValue]: props.imageMinValue,
    [tokens.imageMaxValue]: props.imageMaxValue,
  };
}