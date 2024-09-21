import { glsl } from '@luma.gl/shadertools';
import type { ShaderModule } from '@luma.gl/shadertools';

const shader = glsl`\
uniform particleUniforms {
  float viewportGlobe;
  vec2 viewportGlobeCenter;
  float viewportGlobeRadius;
  vec4 viewportBounds;
  float viewportZoomChangeFactor;

  float numParticles;
  float maxAge;
  float speedFactor;

  float time;
  float seed;
} particle;
`;

export type ParticleProps = {
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

export const particleUniforms = {
  name: 'particle',
  vs: shader,
  fs: shader,
  uniformTypes: {
    viewportGlobe: 'f32',
    viewportGlobeCenter: 'vec2<f32>',
    viewportGlobeRadius: 'f32',
    viewportBounds: 'vec4<f32>',
    viewportZoomChangeFactor: 'f32',

    numParticles: 'f32',
    maxAge: 'f32',
    speedFactor: 'f32',

    time: 'f32',
    seed: 'f32',
  },
} as const satisfies ShaderModule<ParticleProps>;