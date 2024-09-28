import type {ShaderModule} from '@luma.gl/shadertools';
import type {BitmapBoundingBox} from '@deck.gl/layers';
import {sourceCode, tokens} from './bitmap-module.glsl';

export type BitmapModuleProps = {
  bounds: [number, number, number, number];
  coordinateConversion: number;
  transparentColor: [number, number, number, number];
};

export type BitmapModuleUniforms = {[K in keyof typeof tokens]: any};

export const bitmapModule = {
  name: 'bitmap',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens.bounds]: 'vec4<f32>',
    [tokens.coordinateConversion]: 'f32',
    [tokens.transparentColor]: 'vec4<f32>',
  },
} as const satisfies ShaderModule<BitmapModuleUniforms>;

export function getBitmapModuleUniforms(props: BitmapModuleProps): {[bitmapModule.name]: BitmapModuleUniforms} {
  return {
    [bitmapModule.name]: {
      [tokens.bounds]: props.bounds,
      [tokens.coordinateConversion]: props.coordinateConversion,
      [tokens.transparentColor]: props.transparentColor,
    },
  };
}

export function isRectangularBounds(bounds: BitmapBoundingBox): bounds is [number, number, number, number] {
  return Number.isFinite(bounds[0]);
}

export function isRepeatBounds(bounds: BitmapBoundingBox): boolean {
  return isRectangularBounds(bounds) && bounds[2] - bounds[0] === 360;
}