uniform sampler2D labelTexture;

layout(std140) uniform contourUniforms {
  float interval;
  float majorInterval;
  float width;
  float labelSpacing;
  vec2 labelTextureSize;
  vec2 labelCellSize;
  float labelPadding;
  float labelDecimals;
  float labelScale;
  float labelOffset;
  vec4 labelColor;
  vec4 labelOutlineColor;
} contour;
