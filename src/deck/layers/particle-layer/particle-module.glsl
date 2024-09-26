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