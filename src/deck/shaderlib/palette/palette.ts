import type { Texture } from '@luma.gl/core';
import { glsl } from '@luma.gl/shadertools';
import type { ShaderModule } from '@luma.gl/shadertools';

const shader = glsl`\
uniform sampler2D paletteTexture;

uniform paletteUniforms {
  vec2 paletteBounds;
  vec4 paletteColor;
} palette;

float getPaletteValue(float min, float max, float value) {
  return (value - min) / (max - min);
}

vec4 applyPalette(sampler2D paletteTexture, vec2 paletteBounds, vec4 paletteColor, float value) {
  if (paletteBounds[0] < paletteBounds[1]) {
    float paletteValue = getPaletteValue(paletteBounds[0], paletteBounds[1], value);
    return texture(paletteTexture, vec2(paletteValue, 0.));
  } else {
    return paletteColor;
  }
}
`;

export type PaletteProps = {
  paletteTexture: Texture;
  paletteBounds: [number, number];
  paletteColor: [number, number, number, number];
};

export const paletteUniforms = {
  name: 'palette',
  vs: shader,
  fs: shader,
  uniformTypes: {
    paletteBounds: 'vec2<f32>',
    paletteColor: 'vec4<f32>',
  },
} as const satisfies ShaderModule<PaletteProps>;