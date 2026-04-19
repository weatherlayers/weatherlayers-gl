import type {ShaderModule} from '@luma.gl/shadertools';
import {sourceCode, tokens} from './contour-module.glsl';

export type ContourModuleProps = {
  interval: number;
  majorInterval: number;
  width: number;
};

type ContourModuleUniforms = {[K in keyof typeof tokens]: any};

function getUniforms(props: Partial<ContourModuleProps> = {}): ContourModuleUniforms {
  return {
    [tokens['interval'] ?? 'interval']: props.interval,
    [tokens['majorInterval'] ?? 'majorInterval']: props.majorInterval,
    [tokens['width'] ?? 'width']: props.width,
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
  },
  getUniforms,
} as const satisfies ShaderModule<ContourModuleProps, ContourModuleUniforms>;