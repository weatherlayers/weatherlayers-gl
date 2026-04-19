import type {Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {Color} from '@deck.gl/core';
import {deckColorToGl} from '../../_utils/color.js';
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
  borderEnabled?: boolean | null;
  borderWidth?: number | null;
  borderColor?: Color | null;
  gridEnabled?: boolean | null;
  gridSize?: number | null;
  gridColor?: Color | null;
};

type RasterModuleUniforms = {[K in keyof typeof tokens]: any};

function getUniforms(props: Partial<RasterModuleProps> = {}): RasterModuleUniforms {
  return {
    [tokens['imageTexture'] ?? 'imageTexture']: props.imageTexture,
    [tokens['imageTexture2'] ?? 'imageTexture2']: props.imageTexture2,
    [tokens['imageResolution'] ?? 'imageResolution']: props.imageTexture ? [props.imageTexture.width, props.imageTexture.height] : [0, 0],
    [tokens['imageSmoothing'] ?? 'imageSmoothing']: props.imageSmoothing ?? 0,
    [tokens['imageInterpolation'] ?? 'imageInterpolation']: Object.values(ImageInterpolation).indexOf(props.imageInterpolation ?? ImageInterpolation.NEAREST),
    [tokens['imageWeight'] ?? 'imageWeight']: props.imageTexture2 !== props.imageTexture && props.imageWeight ? props.imageWeight : 0,
    [tokens['imageType'] ?? 'imageType']: Object.values(ImageType).indexOf(props.imageType ?? ImageType.SCALAR),
    [tokens['imageUnscale'] ?? 'imageUnscale']: props.imageUnscale ?? [0, 0],
    [tokens['imageMinValue'] ?? 'imageMinValue']: props.imageMinValue ?? Number.MIN_SAFE_INTEGER,
    [tokens['imageMaxValue'] ?? 'imageMaxValue']: props.imageMaxValue ?? Number.MAX_SAFE_INTEGER,
    [tokens['borderEnabled'] ?? 'borderEnabled']: props.borderEnabled ? 1 : 0,
    [tokens['borderWidth'] ?? 'borderWidth']: props.borderWidth ?? 0,
    [tokens['borderColor'] ?? 'borderColor']: props.borderColor ? deckColorToGl(props.borderColor) : [0, 0, 0, 0],
    [tokens['gridEnabled'] ?? 'gridEnabled']: props.gridEnabled ? 1 : 0,
    [tokens['gridSize'] ?? 'gridSize']: props.gridSize ?? 0,
    [tokens['gridColor'] ?? 'gridColor']: props.gridColor ? deckColorToGl(props.gridColor) : [0, 0, 0, 0],
  };
}

export const rasterModule = {
  name: 'raster',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens['imageResolution'] ?? 'imageResolution']: 'vec2<f32>',
    [tokens['imageSmoothing'] ?? 'imageSmoothing']: 'f32',
    [tokens['imageInterpolation'] ?? 'imageInterpolation']: 'f32',
    [tokens['imageWeight'] ?? 'imageWeight']: 'f32',
    [tokens['imageType'] ?? 'imageType']: 'f32',
    [tokens['imageUnscale'] ?? 'imageUnscale']: 'vec2<f32>',
    [tokens['imageMinValue'] ?? 'imageMinValue']: 'f32',
    [tokens['imageMaxValue'] ?? 'imageMaxValue']: 'f32',
    [tokens['borderEnabled'] ?? 'borderEnabled']: 'f32',
    [tokens['borderWidth'] ?? 'borderWidth']: 'f32',
    [tokens['borderColor'] ?? 'borderColor']: 'vec4<f32>',
    [tokens['gridEnabled'] ?? 'gridEnabled']: 'f32',
    [tokens['gridSize'] ?? 'gridSize']: 'f32',
    [tokens['gridColor'] ?? 'gridColor']: 'vec4<f32>',
  },
  getUniforms,
} as const satisfies ShaderModule<RasterModuleProps, RasterModuleUniforms>;