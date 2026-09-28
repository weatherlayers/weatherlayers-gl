uniform sampler2D labelTexture;
uniform sampler2D labelAnchorTexture;
uniform sampler2D labelVisibleTexture;

layout(std140) uniform contourUniforms {
  float interval;
  float majorInterval;
  float width;
  float labelGridSize;
  float labelGridLevel;
  vec2 labelGridOrigin;
  vec2 labelGridCount;
  vec4 labelViewBounds;
  float labelTraceStep;
  float labelSearchRadius;
  float labelMaxHalfWidth;
  float labelPixelSize;
  float labelGlobe;
  float labelMinorContours;
  vec2 labelScreenRight;
  vec2 labelTextureSize;
  vec2 labelCellSize;
  float labelPadding;
  float labelDecimals;
  float labelScale;
  float labelOffset;
  vec4 labelColor;
  vec4 labelOutlineColor;
} contour;
