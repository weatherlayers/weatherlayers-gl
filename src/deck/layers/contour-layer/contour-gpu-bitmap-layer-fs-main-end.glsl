bitmapColor = texture2DInterpolate(bitmapTexture, bitmapTexture2, imageTexelSize, imageInterpolate, uv);

// drop nodata
if (!raster_has_values(bitmapColor)) {
  discard;
}

float value = raster_get_value(bitmapColor);
float contourValue = value / interval;
float major = step(fract(contourValue * 0.2), 0.1); // 1: major contour every fifth contour, 0: minor contour
float contourWidth = width * (1. + major) - 0.5; // major contour: thicker

// https://stackoverflow.com/a/30909828/1823988
// https://forum.unity.com/threads/antialiased-grid-lines-fwidth.1010668/
// https://www.shadertoy.com/view/Mlfyz2
float factor = abs(fract(contourValue + 0.5) - 0.5); // contour position, min 0: contour, max 0.5: between contours
float dfactor = fwidth(contourValue); // contour derivation, consistent width in screen space
float contourOpacity = 1. - clamp(factor / dfactor - contourWidth, 0., 1.);

// contourOpacity += factor; // debug
gl_FragColor = vec4(color.rgb, color.a * contourOpacity * rasterOpacity);