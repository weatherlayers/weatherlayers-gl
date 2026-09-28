import type {Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {Color} from '@deck.gl/core';
import {deckColorToGl} from '../../_utils/color.js';
import {sourceCode, tokens} from './contour-module.glsl';

export type ContourModuleProps = {
  interval: number;
  majorInterval: number;
  width: number;
  labelTexture?: Texture;
  labelSpacing?: number; // device pixels, 0: labels disabled
  labelTextureSize?: [number, number];
  labelCellSize?: [number, number];
  labelPadding?: number;
  labelDecimals?: number;
  labelScale?: number;
  labelOffset?: number;
  labelColor?: Color | null;
  labelOutlineColor?: Color | null;
};

type ContourModuleUniforms = {[K in keyof typeof tokens]: any};

function getUniforms(props: Partial<ContourModuleProps> = {}): ContourModuleUniforms {
  return {
    [tokens['interval'] ?? 'interval']: props.interval,
    [tokens['majorInterval'] ?? 'majorInterval']: props.majorInterval,
    [tokens['width'] ?? 'width']: props.width,
    [tokens['labelTexture'] ?? 'labelTexture']: props.labelTexture,
    [tokens['labelSpacing'] ?? 'labelSpacing']: props.labelSpacing ?? 0,
    [tokens['labelTextureSize'] ?? 'labelTextureSize']: props.labelTextureSize ?? [1, 1],
    [tokens['labelCellSize'] ?? 'labelCellSize']: props.labelCellSize ?? [1, 1],
    [tokens['labelPadding'] ?? 'labelPadding']: props.labelPadding ?? 0,
    [tokens['labelDecimals'] ?? 'labelDecimals']: props.labelDecimals ?? 0,
    [tokens['labelScale'] ?? 'labelScale']: props.labelScale ?? 1,
    [tokens['labelOffset'] ?? 'labelOffset']: props.labelOffset ?? 0,
    [tokens['labelColor'] ?? 'labelColor']: props.labelColor ? deckColorToGl(props.labelColor) : [0, 0, 0, 0],
    [tokens['labelOutlineColor'] ?? 'labelOutlineColor']: props.labelOutlineColor ? deckColorToGl(props.labelOutlineColor) : [0, 0, 0, 0],
  };
}

export const contourModule = {
  name: 'contour',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens['interval'] ?? 'interval']: 'f32',
    [tokens['majorInterval'] ?? 'majorInterval']: 'f32',
    [tokens['width'] ?? 'width']: 'f32',
    [tokens['labelSpacing'] ?? 'labelSpacing']: 'f32',
    [tokens['labelTextureSize'] ?? 'labelTextureSize']: 'vec2<f32>',
    [tokens['labelCellSize'] ?? 'labelCellSize']: 'vec2<f32>',
    [tokens['labelPadding'] ?? 'labelPadding']: 'f32',
    [tokens['labelDecimals'] ?? 'labelDecimals']: 'f32',
    [tokens['labelScale'] ?? 'labelScale']: 'f32',
    [tokens['labelOffset'] ?? 'labelOffset']: 'f32',
    [tokens['labelColor'] ?? 'labelColor']: 'vec4<f32>',
    [tokens['labelOutlineColor'] ?? 'labelOutlineColor']: 'vec4<f32>',
  },
  getUniforms,
} as const satisfies ShaderModule<ContourModuleProps, ContourModuleUniforms>;
