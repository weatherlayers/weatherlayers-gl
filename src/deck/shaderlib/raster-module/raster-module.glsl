uniform sampler2D imageTexture;
uniform sampler2D imageTexture2;

uniform rasterUniforms {
  vec2 imageResolution;
  float imageSmoothing;
  float imageInterpolation;
  float imageWeight;
  float imageType;
  vec2 imageUnscale;
  float imageMinValue;
  float imageMaxValue;
  float borderEnabled;
  float borderWidth;
  vec4 borderColor;
  float gridEnabled;
  float gridSize;
  vec4 gridColor;
} raster;