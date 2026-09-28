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
  labelAnchorTexture?: Texture;
  labelVisibleTexture?: Texture;
  labelGridSize?: number; // Web Mercator units, 0: labels disabled
  labelGridLevel?: number; // log2 of world size / grid size
  labelGridOrigin?: [number, number]; // column, row of the candidate texture origin
  labelGridCount?: [number, number]; // candidate texture size
  labelViewBounds?: [number, number, number, number]; // Web Mercator bounds of the viewport
  labelTraceStep?: number; // Web Mercator units
  labelSearchRadius?: number; // grid cells
  labelMaxHalfWidth?: number; // device pixels
  labelPixelSize?: number; // Web Mercator units per device pixel
  labelGlobe?: boolean;
  labelMinorContours?: boolean;
  labelScreenRight?: [number, number]; // Mercator direction of screen right, labels are upright if their tangent points right
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
    [tokens['labelAnchorTexture'] ?? 'labelAnchorTexture']: props.labelAnchorTexture,
    [tokens['labelVisibleTexture'] ?? 'labelVisibleTexture']: props.labelVisibleTexture,
    [tokens['labelGridSize'] ?? 'labelGridSize']: props.labelGridSize ?? 0,
    [tokens['labelGridLevel'] ?? 'labelGridLevel']: props.labelGridLevel ?? 0,
    [tokens['labelGridOrigin'] ?? 'labelGridOrigin']: props.labelGridOrigin ?? [0, 0],
    [tokens['labelGridCount'] ?? 'labelGridCount']: props.labelGridCount ?? [1, 1],
    [tokens['labelViewBounds'] ?? 'labelViewBounds']: props.labelViewBounds ?? [0, 0, 0, 0],
    [tokens['labelTraceStep'] ?? 'labelTraceStep']: props.labelTraceStep ?? 0,
    [tokens['labelSearchRadius'] ?? 'labelSearchRadius']: props.labelSearchRadius ?? 0,
    [tokens['labelMaxHalfWidth'] ?? 'labelMaxHalfWidth']: props.labelMaxHalfWidth ?? 0,
    [tokens['labelPixelSize'] ?? 'labelPixelSize']: props.labelPixelSize ?? 0,
    [tokens['labelGlobe'] ?? 'labelGlobe']: props.labelGlobe ? 1 : 0,
    [tokens['labelMinorContours'] ?? 'labelMinorContours']: props.labelMinorContours ? 1 : 0,
    [tokens['labelScreenRight'] ?? 'labelScreenRight']: props.labelScreenRight ?? [1, 0],
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
    [tokens['labelGridSize'] ?? 'labelGridSize']: 'f32',
    [tokens['labelGridLevel'] ?? 'labelGridLevel']: 'f32',
    [tokens['labelGridOrigin'] ?? 'labelGridOrigin']: 'vec2<f32>',
    [tokens['labelGridCount'] ?? 'labelGridCount']: 'vec2<f32>',
    [tokens['labelViewBounds'] ?? 'labelViewBounds']: 'vec4<f32>',
    [tokens['labelTraceStep'] ?? 'labelTraceStep']: 'f32',
    [tokens['labelSearchRadius'] ?? 'labelSearchRadius']: 'f32',
    [tokens['labelMaxHalfWidth'] ?? 'labelMaxHalfWidth']: 'f32',
    [tokens['labelPixelSize'] ?? 'labelPixelSize']: 'f32',
    [tokens['labelGlobe'] ?? 'labelGlobe']: 'f32',
    [tokens['labelMinorContours'] ?? 'labelMinorContours']: 'f32',
    [tokens['labelScreenRight'] ?? 'labelScreenRight']: 'vec2<f32>',
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
