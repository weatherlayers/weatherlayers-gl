import type {ShaderModule} from '@luma.gl/shadertools';
import {sourceCode, tokens} from './contour-module.glsl';

export type ContourModuleProps = {
  interval: number;
  majorInterval: number;
  width: number;
};

export type ContourModuleUniforms = {[K in keyof typeof tokens]: any};

export const contourModule = {
  name: 'contour',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens.interval]: 'f32',
    [tokens.majorInterval]: 'f32',
    [tokens.width]: 'f32',
  },
} as const satisfies ShaderModule<ContourModuleUniforms>;

export function getContourModuleUniforms(props: ContourModuleProps): ContourModuleUniforms {
  return {
    [tokens.interval]: props.interval,
    [tokens.majorInterval]: props.majorInterval,
    [tokens.width]: props.width,
  };
}