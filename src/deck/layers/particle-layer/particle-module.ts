import type {ShaderModule} from '@luma.gl/shadertools';
import {sourceCode, tokens} from './particle-module.glsl';

export type ParticleModuleProps = {
  viewportGlobe?: boolean;
  viewportGlobeCenter?: [number, number];
  viewportGlobeRadius?: number;
  viewportBounds?: [number, number, number, number];
  viewportZoomChangeFactor?: number;

  numParticles: number;
  maxAge: number;
  speedFactor: number;

  time: number;
  seed: number;
};

type ParticleModuleUniforms = {[K in keyof typeof tokens]: any};

function getUniforms(props: Partial<ParticleModuleProps> = {}): ParticleModuleUniforms {
  return {
    [tokens['viewportGlobe'] ?? 'viewportGlobe']: props.viewportGlobe ? 1 : 0,
    [tokens['viewportGlobeCenter'] ?? 'viewportGlobeCenter']: props.viewportGlobeCenter ?? [0, 0],
    [tokens['viewportGlobeRadius'] ?? 'viewportGlobeRadius']: props.viewportGlobeRadius ?? 0,
    [tokens['viewportBounds'] ?? 'viewportBounds']: props.viewportBounds ?? [0, 0, 0, 0],
    [tokens['viewportZoomChangeFactor'] ?? 'viewportZoomChangeFactor']: props.viewportZoomChangeFactor ?? 0,

    [tokens['numParticles'] ?? 'numParticles']: props.numParticles,
    [tokens['maxAge'] ?? 'maxAge']: props.maxAge,
    [tokens['speedFactor'] ?? 'speedFactor']: props.speedFactor,

    [tokens['time'] ?? 'time']: props.time,
    [tokens['seed'] ?? 'seed']: props.seed,
  };
}

export const particleModule = {
  name: 'particle',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens['viewportGlobe'] ?? 'viewportGlobe']: 'f32',
    [tokens['viewportGlobeCenter'] ?? 'viewportGlobeCenter']: 'vec2<f32>',
    [tokens['viewportGlobeRadius'] ?? 'viewportGlobeRadius']: 'f32',
    [tokens['viewportBounds'] ?? 'viewportBounds']: 'vec4<f32>',
    [tokens['viewportZoomChangeFactor'] ?? 'viewportZoomChangeFactor']: 'f32',

    [tokens['numParticles'] ?? 'numParticles']: 'f32',
    [tokens['maxAge'] ?? 'maxAge']: 'f32',
    [tokens['speedFactor'] ?? 'speedFactor']: 'f32',

    [tokens['time'] ?? 'time']: 'f32',
    [tokens['seed'] ?? 'seed']: 'f32',
  },
  getUniforms,
} as const satisfies ShaderModule<ParticleModuleProps, ParticleModuleUniforms>;