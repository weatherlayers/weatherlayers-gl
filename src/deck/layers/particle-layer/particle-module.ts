import type {ShaderModule} from '@luma.gl/shadertools';
import {sourceCode, tokens} from './particle-module.glsl';

export type ParticleModuleProps = {
  viewportGlobe: number;
  viewportGlobeCenter: [number, number];
  viewportGlobeRadius: number;
  viewportBounds: [number, number, number, number];
  viewportZoomChangeFactor: number;

  numParticles: number;
  maxAge: number;
  speedFactor: number;

  time: number;
  seed: number;
};

export type ParticleModuleUniforms = {[K in keyof typeof tokens]: any};

export const particleModule = {
  name: 'particle',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens.viewportGlobe]: 'f32',
    [tokens.viewportGlobeCenter]: 'vec2<f32>',
    [tokens.viewportGlobeRadius]: 'f32',
    [tokens.viewportBounds]: 'vec4<f32>',
    [tokens.viewportZoomChangeFactor]: 'f32',

    [tokens.numParticles]: 'f32',
    [tokens.maxAge]: 'f32',
    [tokens.speedFactor]: 'f32',

    [tokens.time]: 'f32',
    [tokens.seed]: 'f32',
  },
} as const satisfies ShaderModule<ParticleModuleUniforms>;

export function getParticleModuleUniforms(props: ParticleModuleProps): {[particleModule.name]: ParticleModuleUniforms} {
  return {
    [particleModule.name]: {
      [tokens.viewportGlobe]: props.viewportGlobe,
      [tokens.viewportGlobeCenter]: props.viewportGlobeCenter,
      [tokens.viewportGlobeRadius]: props.viewportGlobeRadius,
      [tokens.viewportBounds]: props.viewportBounds,
      [tokens.viewportZoomChangeFactor]: props.viewportZoomChangeFactor,

      [tokens.numParticles]: props.numParticles,
      [tokens.maxAge]: props.maxAge,
      [tokens.speedFactor]: props.speedFactor,

      [tokens.time]: props.time,
      [tokens.seed]: props.seed,
    },
  };
}