vec4 pixel = getPixelInterpolate(bitmapTexture, bitmapTexture2, imageTexelSize, imageInterpolate, imageWeight, uv);

// drop nodata
if (!raster_has_values(pixel)) {
  discard;
}

float value = raster_get_value(pixel);
float contourValue = value / interval;
float major = step(fract(contourValue * 0.2), 0.1); // 1: major contour every fifth contour, 0: minor contour

float contourWidth = width * (major + 1.) - 0.5; // major contour: double width

// https://stackoverflow.com/a/30909828/1823988
// https://forum.unity.com/threads/antialiased-grid-lines-fwidth.1010668/
// https://www.shadertoy.com/view/Mlfyz2
float factor = abs(fract(contourValue + 0.5) - 0.5); // contour position, min 0: contour, max 0.5: between contours
float dFactor = fwidth(contourValue); // contour derivation, consistent width in screen space
float contourOpacity = 1. - clamp((factor / dFactor) - contourWidth, 0., 1.);

// contourOpacity += factor; // debug
gl_FragColor = vec4(color.rgb, color.a * ((major + 1.) / 2.) * contourOpacity * opacity); // minor contour: half opacity