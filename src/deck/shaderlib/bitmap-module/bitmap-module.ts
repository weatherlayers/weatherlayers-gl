import type {ShaderModule} from '@luma.gl/shadertools';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import type {CoordinateSystem} from '@deck.gl/core';
import type {Color} from '@deck.gl/core';
import type {BitmapBoundingBox} from '@deck.gl/layers';
import {deckColorToGl} from '../../_utils/color.js';
import {isRepeatBounds} from '../../_utils/bounds.js';
import {sourceCode, tokens} from './bitmap-module.glsl';

export type BitmapModuleProps = {
  viewportGlobe?: boolean;
  bounds?: BitmapBoundingBox;
  _imageCoordinateSystem?: CoordinateSystem;
  transparentColor?: Color | null;
};

type BitmapModuleUniforms = {[K in keyof typeof tokens]: any};

function isRectangularBounds(bounds: BitmapBoundingBox): bounds is [number, number, number, number] {
  return Number.isFinite(bounds[0]);
}

// copied from https://github.com/visgl/math.gl/blob/master/modules/web-mercator/src/web-mercator-utils.ts
const PI = Math.PI;
const PI_4 = PI / 4;
const DEGREES_TO_RADIANS = PI / 180;
const TILE_SIZE = 512;
function lngLatToWorld(lngLat: number[]): [number, number] {
  const [lng, lat] = lngLat;

  const lambda2 = lng * DEGREES_TO_RADIANS;
  const phi2 = lat * DEGREES_TO_RADIANS;
  const x = (TILE_SIZE * (lambda2 + PI)) / (2 * PI);
  const y = (TILE_SIZE * (PI + Math.log(Math.tan(PI_4 + phi2 * 0.5)))) / (2 * PI);
  return [x, y];
}

// copied from https://github.com/visgl/deck.gl/blob/master/modules/layers/src/bitmap-layer/bitmap-layer.ts
function _getCoordinateUniforms(props: Partial<BitmapModuleProps> = {}): {coordinateConversion: number; bounds: [number, number, number, number]} {
  const {LNGLAT, CARTESIAN, DEFAULT} = COORDINATE_SYSTEM;
  let {viewportGlobe, bounds, _imageCoordinateSystem: imageCoordinateSystem} = props;
  if (!isRectangularBounds(bounds!)) {
    throw new Error('_imageCoordinateSystem only supports rectangular bounds');
  }

  if (imageCoordinateSystem !== DEFAULT) {
    // The default behavior (linearly interpolated tex coords)
    const defaultImageCoordinateSystem = viewportGlobe ? LNGLAT : CARTESIAN;
    imageCoordinateSystem = imageCoordinateSystem === LNGLAT ? LNGLAT : CARTESIAN;

    if (imageCoordinateSystem === LNGLAT && defaultImageCoordinateSystem === CARTESIAN) {
      // LNGLAT in Mercator, e.g. display LNGLAT-encoded image in WebMercator projection
      return {coordinateConversion: -1, bounds};
    }
    if (imageCoordinateSystem === CARTESIAN && defaultImageCoordinateSystem === LNGLAT) {
      // Mercator in LNGLAT, e.g. display WebMercator encoded image in Globe projection
      const bottomLeft = lngLatToWorld([bounds[0], bounds[1]]);
      const topRight = lngLatToWorld([bounds[2], bounds[3]]);
      return {
        coordinateConversion: 1,
        bounds: [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]]
      };
    }
  }
  return {coordinateConversion: 0, bounds}; // bounds are used by particle layer in globe
}

function getUniforms(props: Partial<BitmapModuleProps> = {}): BitmapModuleUniforms {
  const {bounds, coordinateConversion} = _getCoordinateUniforms(props);

  return {
    [tokens.bounds]: bounds,
    [tokens.isRepeatBounds]: isRepeatBounds(bounds) ? 1 : 0,
    [tokens.coordinateConversion]: coordinateConversion,
    [tokens.transparentColor]: props.transparentColor ? deckColorToGl(props.transparentColor) : [0, 0, 0, 0],
  };
}

export const bitmapModule = {
  name: 'bitmap2',
  vs: sourceCode,
  fs: sourceCode,
  uniformTypes: {
    [tokens.bounds]: 'vec4<f32>',
    [tokens.isRepeatBounds]: 'f32',
    [tokens.coordinateConversion]: 'f32',
    [tokens.transparentColor]: 'vec4<f32>',
  },
  getUniforms,
} as const satisfies ShaderModule<BitmapModuleProps, BitmapModuleUniforms>;