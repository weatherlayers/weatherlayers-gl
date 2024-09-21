import { glsl } from '@luma.gl/shadertools';
import type { ShaderModule } from '@luma.gl/shadertools';

const shader = glsl`\
uniform contourUniforms {
  float interval;
  float majorInterval;
  float width;
} contour;
`;

export type ContourProps = {
  interval: number;
  majorInterval: number;
  width: number;
};

export const contourUniforms = {
  name: 'contour',
  vs: shader,
  fs: shader,
  uniformTypes: {
    interval: 'f32',
    majorInterval: 'f32',
    width: 'f32',
  },
} as const satisfies ShaderModule<ContourProps>;