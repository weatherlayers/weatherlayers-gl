import type { Texture } from '@luma.gl/core';
import { glsl } from '@luma.gl/shadertools';
import type { ShaderModule } from '@luma.gl/shadertools';

const shader = glsl`\
uniform sampler2D imageTexture;
uniform sampler2D imageTexture2;

uniform rasterUniforms {
  vec2 imageResolution;
  float imageSmoothing;
  float imageInterpolation;
  float imageWeight;
  float imageType;
  vec2 imageUnscale;
  float imageMinValue;
  float imageMaxValue;
} raster;
`;

export type RasterProps = {
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

export const rasterUniforms = {
  name: 'raster',
  vs: shader,
  fs: shader,
  uniformTypes: {
    imageResolution: 'vec2<f32>',
    imageSmoothing: 'f32',
    imageInterpolation: 'f32',
    imageWeight: 'f32',
    imageType: 'f32',
    imageUnscale: 'vec2<f32>',
    imageMinValue: 'f32',
    imageMaxValue: 'f32',
  },
} as const satisfies ShaderModule<RasterProps>;