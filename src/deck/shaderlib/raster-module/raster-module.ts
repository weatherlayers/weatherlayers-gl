import type {Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {ImageInterpolation} from '../../_utils/image-interpolation.js';
import {ImageType} from '../../_utils/image-type.js';
import {sourceCode, tokens} from './raster-module.glsl';

export type RasterModuleProps = {
  imageTexture: Texture;
  imageTexture2?: Texture;
  imageSmoothing?: number | null;
  imageInterpolation?: ImageInterpolation | null;
  imageWeight?: number | null;
  imageType?: ImageType | null;
  imageUnscale?: [number, number] | null;
  imageMinValue?: number | null;
  imageMaxValue?: number | null;
};

type RasterModuleUniforms = {[K in keyof typeof tokens]: any};

function getUniforms(props: Partial<RasterModuleProps> = {}): RasterModuleUniforms {
  return {
    [tokens.imageTexture]: props.imageTexture,
    [tokens.imageTexture2]: props.imageTexture2,
    [tokens.imageResolution]: props.imageTexture ? [props.imageTexture.width, props.imageTexture.height] : [0, 0],
    [tokens.imageSmoothing]: props.imageSmoothing ?? 0,
    [tokens.imageInterpolation]: Object.values(ImageInterpolation).indexOf(props.imageInterpolation ?? ImageInterpolation.NEAREST),
    [tokens.imageWeight]: props.imageTexture2 !== props.imageTexture && props.imageWeight ? props.imageWeight : 0,
    [tokens.imageType]: Object.values(ImageType).indexOf(props.imageType ?? ImageType.SCALAR),
    [tokens.imageUnscale]: props.imageUnscale ?? [0, 0],
    [tokens.imageMinValue]: props.imageMinValue ?? Number.MIN_SAFE_INTEGER,
    [tokens.imageMaxValue]: props.imageMaxValue ?? Number.MAX_SAFE_INTEGER,
  };
}

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
  getUniforms,
} as const satisfies ShaderModule<RasterModuleProps, RasterModuleUniforms>;