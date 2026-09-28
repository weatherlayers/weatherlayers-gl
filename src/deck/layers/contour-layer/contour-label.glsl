// shared functions of contour label passes and the contour fragment shader
// requires bitmap2, raster, contour modules, pixel.glsl, pixel-value.glsl

// glyph indexes in the atlas, see CONTOUR_LABEL_GLYPHS
const float LABEL_GLYPH_MINUS = 10.;
const float LABEL_GLYPH_DOT = 11.;
const float LABEL_MAX_CHARS = 12.;
const float LABEL_MAX_DECIMALS = 4.;
const float LABEL_ATLAS_HEADER_HEIGHT = 2.;
const float LABEL_WORLD_SIZE = 512.;
const float LABEL_INVALID_SCORE = -1e30;
const float LABEL_MAX_GRID_COUNT = 64.; // must match CONTOUR_LABEL_MAX_GRID_COUNT

// value at a Web Mercator position, the longitude is wrapped into the image bounds
// x: value, y: 1 if valid, 0 otherwise
vec2 getLabelPositionValue(vec2 position) {
  vec2 lnglat = mercator_to_lnglat(position);
  lnglat.x = bitmap2.bounds[0] + mod(lnglat.x - bitmap2.bounds[0], 360.);
  vec2 uv = getUV(lnglat);
  if (uv.y < 0. || uv.y > 1. || (!bitmap2.isRepeatBounds && (uv.x < 0. || uv.x > 1.))) {
    return vec2(0.);
  }

  vec4 pixel = getPixelSmoothInterpolate(imageTexture, imageTexture2, raster.imageResolution, raster.imageSmoothing, raster.imageInterpolation, raster.imageWeight, bitmap2.isRepeatBounds, uv);
  if (!hasPixelValue(pixel, raster.imageUnscale)) {
    return vec2(0.);
  }

  float value = getPixelMagnitudeValue(pixel, raster.imageType, raster.imageUnscale);
  if (
    (!isNaN(raster.imageMinValue) && value < raster.imageMinValue) ||
    (!isNaN(raster.imageMaxValue) && value > raster.imageMaxValue)
  ) {
    return vec2(0.);
  }

  return vec2(value, 1.);
}

// gradient step fixed to a fraction of a texel, independently of zoom, so that anchors are stable
float getLabelGradientStep() {
  return 0.25 * abs(bitmap2.bounds[2] - bitmap2.bounds[0]) / raster.imageResolution.x * LABEL_WORLD_SIZE / 360.;
}

// x: value, y: 1 if valid, 0 otherwise, zw: gradient
vec4 getLabelPositionValueGradient(vec2 position) {
  float h = getLabelGradientStep();
  vec2 value = getLabelPositionValue(position);
  vec2 valueX = getLabelPositionValue(position + vec2(h, 0.));
  vec2 valueY = getLabelPositionValue(position + vec2(0., h));
  if (value.y == 0. || valueX.y == 0. || valueY.y == 0.) {
    return vec4(0.);
  }
  return vec4(value.x, 1., vec2(valueX.x - value.x, valueY.x - value.x) / h);
}

float getLabelInterval() {
  float majorIntervalRatio = contour.majorInterval > contour.interval ? floor(contour.majorInterval / contour.interval) : 1.;
  return contour.labelMinorContours > 0.5 ? contour.interval : contour.interval * majorIntervalRatio;
}

// Mercator units per device pixel at the position
float getLabelPixelSize(vec2 position) {
  float pixelSize = contour.labelPixelSize;
  if (contour.labelGlobe > 0.5) {
    pixelSize /= cos(radians(mercator_to_lnglat(position).y));
  }
  return pixelSize;
}

// shortest Mercator offset, across the antimeridian
vec2 getLabelWrappedOffset(vec2 offset) {
  offset.x -= LABEL_WORLD_SIZE * floor(offset.x / LABEL_WORLD_SIZE + 0.5);
  return offset;
}

// candidate grid, see ContourBitmapLayer._updateLabels
// triangle grid, the same as generateGrid in viewport-grid.ts used by GridLayer, odd columns are shifted by half a cell
// x: column, y: row coordinate including the half cell shift
vec2 getLabelCandidateSeedCell(vec2 index) {
  float column = contour.labelGridOrigin.x + index.x;
  float row = contour.labelGridOrigin.y + index.y + mod(column, 2.) * 0.5;
  return vec2(column, row);
}

vec2 getLabelCandidateTexCoord(vec2 index) {
  return (index + 0.5) / contour.labelGridCount;
}

// candidate texture index of the grid cell, x < 0 if out of the candidate grid
vec2 getLabelCandidateIndex(float column, float row) {
  float worldColumns = LABEL_WORLD_SIZE / contour.labelGridSize;
  float x = mod(column - contour.labelGridOrigin.x, worldColumns);
  float y = row - contour.labelGridOrigin.y;
  if (x >= contour.labelGridCount.x || y < 0. || y >= contour.labelGridCount.y) {
    return vec2(-1.);
  }
  return vec2(x, y);
}

// stable priority of a seed, the integer part is the number of coarser grids containing the seed, the fractional part is a hash
float getLabelSeedPriority(vec2 cell) {
  float worldColumns = LABEL_WORLD_SIZE / contour.labelGridSize;
  float column = mod(cell.x, worldColumns);
  float row = cell.y;
  float hash = fract(sin(dot(vec2(column, row), vec2(12.9898, 78.233))) * 43758.5453);

  float coarserGrids = 0.;
  for (float i = 0.; i < 24.; i++) {
    if (i >= contour.labelGridLevel || mod(column, 2.) != 0.) {
      break;
    }
    column /= 2.;
    row /= 2.;
    if (fract(row - mod(column, 2.) * 0.5) != 0.) {
      break;
    }
    coarserGrids += 1.;
  }
  return coarserGrids + 0.5 * hash;
}

float getLabelGlyphAdvance(float glyph) {
  return texture(labelTexture, (vec2(glyph, 0.) + 0.5) / contour.labelTextureSize).r * 255.;
}

float getLabelDecimals() {
  return clamp(floor(contour.labelDecimals), 0., LABEL_MAX_DECIMALS);
}

// text, formatted the same as formatValue
// x: digits, rounded absolute value multiplied by 10^decimals, i.e. all digits without the dot
// y: 1 if negative, z: integer digits count, w: chars count, 0 if too long
vec4 getLabelText(float labelValue) {
  float displayValue = labelValue * contour.labelScale + contour.labelOffset;
  float decimals = getLabelDecimals();
  float decimalsFactor = 1.;
  for (float i = 0.; i < LABEL_MAX_DECIMALS; i++) {
    if (i >= decimals) {
      break;
    }
    decimalsFactor *= 10.;
  }
  float digits = floor(abs(displayValue) * decimalsFactor + 0.5);
  float negative = displayValue < 0. && digits > 0. ? 1. : 0.;
  float intPart = floor(digits / decimalsFactor);
  float intDigits = 1.;
  float intDigitsFactor = 10.;
  for (float i = 0.; i < LABEL_MAX_CHARS; i++) {
    if (intPart < intDigitsFactor) {
      break;
    }
    intDigits += 1.;
    intDigitsFactor *= 10.;
  }
  float charsCount = negative + intDigits + (decimals > 0. ? 1. + decimals : 0.);
  return vec4(digits, negative, intDigits, charsCount <= LABEL_MAX_CHARS ? charsCount : 0.);
}

float getLabelGlyph(float charIndex, vec4 text) {
  float digits = text.x;
  float negative = text.y;
  float intDigits = text.z;
  float decimals = getLabelDecimals();
  if (negative > 0. && charIndex == 0.) {
    return LABEL_GLYPH_MINUS;
  }

  float digitIndex = charIndex - negative;
  if (decimals > 0. && digitIndex == intDigits) {
    return LABEL_GLYPH_DOT;
  }
  if (digitIndex > intDigits) {
    digitIndex -= 1.;
  }

  // multiply instead of pow to keep integers exact
  float digitsCount = intDigits + decimals;
  float divisor = 1.;
  for (float i = 0.; i < LABEL_MAX_CHARS; i++) {
    if (i >= digitsCount - 1. - digitIndex) {
      break;
    }
    divisor *= 10.;
  }
  return mod(floor(digits / divisor), 10.);
}

float getLabelTextWidth(vec4 text) {
  float textWidth = 0.;
  for (float i = 0.; i < LABEL_MAX_CHARS; i++) {
    if (i >= text.w) {
      break;
    }
    textWidth += getLabelGlyphAdvance(getLabelGlyph(i, text));
  }
  return textWidth;
}

// half size of the label box in device pixels
vec2 getLabelHalfSize(vec4 text) {
  return vec2(getLabelTextWidth(text) / 2. + contour.labelPadding, contour.labelCellSize.y / 2.);
}
