// copied from https://github.com/visgl/deck.gl/blob/master/modules/layers/src/bitmap-layer/bitmap-layer-fragment.ts
import { glsl } from '@luma.gl/shadertools';
import type { ShaderModule } from '@luma.gl/shadertools';
import type { BitmapBoundingBox } from '@deck.gl/layers';

const shader = glsl`\
uniform bitmapUniforms {
  vec4 bounds;
  float coordinateConversion;
  vec4 transparentColor;
} bitmap;

/* projection utils */
// TODO: use from project shader module
const float _TILE_SIZE = 512.0;
const float _PI = 3.1415926536;
const float _WORLD_SCALE = _TILE_SIZE / _PI / 2.0;

// from degrees to Web Mercator
vec2 lnglat_to_mercator(vec2 lnglat) {
  float x = lnglat.x;
  float y = clamp(lnglat.y, -89.9, 89.9);
  return vec2(
    radians(x) + _PI,
    _PI + log(tan(_PI * 0.25 + radians(y) * 0.5))
  ) * _WORLD_SCALE;
}

// from Web Mercator to degrees
vec2 mercator_to_lnglat(vec2 xy) {
  xy /= _WORLD_SCALE;
  return degrees(vec2(
    xy.x - _PI,
    atan(exp(xy.y - _PI)) * 2.0 - _PI * 0.5
  ));
}
/* End projection utils */

// blend with background color
// TODO: update with https://github.com/visgl/deck.gl/pull/7441
vec4 apply_opacity(vec3 color, float alpha) {
  return mix(bitmap.transparentColor, vec4(color, 1.0), alpha);
}

vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (pos.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

vec2 getUVWithCoordinateConversion(vec2 vTexCoord, vec2 vTexPos) {
  vec2 uv = vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    vec2 lnglat = mercator_to_lnglat(vTexPos);
    uv = getUV(lnglat);
  } else if (bitmap.coordinateConversion > 0.5) {
    vec2 commonPos = lnglat_to_mercator(vTexPos);
    uv = getUV(commonPos);
  }
  return uv;
}
`;

export type BitmapProps = {
  bounds: [number, number, number, number];
  coordinateConversion: number;
  transparentColor: [number, number, number, number];
};

export const bitmapUniforms = {
  name: 'bitmap',
  vs: shader,
  fs: shader,
  uniformTypes: {
    bounds: 'vec4<f32>',
    coordinateConversion: 'f32',
    transparentColor: 'vec4<f32>',
  },
} as const satisfies ShaderModule<BitmapProps>;

export function isRectangularBounds(bounds: BitmapBoundingBox): bounds is [number, number, number, number] {
  return Number.isFinite(bounds[0]);
}

export function isRepeatBounds(bounds: BitmapBoundingBox): boolean {
  return isRectangularBounds(bounds) && bounds[2] - bounds[0] === 360;
}