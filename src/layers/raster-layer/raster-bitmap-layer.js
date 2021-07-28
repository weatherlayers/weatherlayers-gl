/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {BitmapLayer} from '@deck.gl/layers';
import GL from '@luma.gl/constants';

const defaultProps = {
  ...BitmapLayer.defaultProps,

  image2: {type: 'image', value: null, async: true},
  imageWeight: {type: 'number', value: 0},
  imageBounds: {type: 'array', value: null},
  imageType: {type: 'number', value: 0},
  colormapImage: {type: 'image', value: null, async: true},
  colormapBounds: {type: 'array', value: null},

  rasterOpacity: {type: 'number', min: 0, max: 1, value: 1},
};

export class RasterBitmapLayer extends BitmapLayer {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      inject: {
        ...parentShaders.inject,
        'fs:#decl': `
          ${(parentShaders.inject || {})['fs:#decl'] || ''}
          const float RASTER_PI = 3.1415926535;

          uniform sampler2D bitmapTexture2;
          uniform float imageWeight;
          uniform float imageType;
          uniform float imageUnscale;
          uniform vec2 imageBounds;
          uniform sampler2D colormapImage;
          uniform vec2 colormapBounds;
          uniform float rasterOpacity;

          bool isNan(float value) {
            return (value <= 0.0 || 0.0 <= value) ? false : true;
          }

          bool hasValues(vec4 values) {
            return !isNan(values.x) && values.a == 1.0;
          }

          float unscale(float min, float max, float value) {
            return (value - min) / (max - min);
          }

          // see https://stackoverflow.com/a/27228836/1823988
          float atan2(float y, float x) {
            return x == 0. ? sign(y) * RASTER_PI / 2. : atan(y, x);
          }

          float raster_get_colormap_value(vec4 color) {
            float value;
            if (imageType > 0.5) {
              if (imageUnscale > 0.5) {
                value = length(mix(vec2(imageBounds[0]), vec2(imageBounds[1]), color.xy));
              } else {
                value = length(color.xy);
              }
            } else {
              if (imageUnscale > 0.5) {
                value = mix(imageBounds[0], imageBounds[1], color.x);
              } else {
                value = color.x;
              }
            }

            return unscale(colormapBounds[0], colormapBounds[1], value);
          }

          float raster_get_direction_value(vec4 color) {
            if (imageType > 0.5) {
              vec2 value;
              if (imageUnscale > 0.5) {
                value = mix(vec2(imageBounds[0]), vec2(imageBounds[1]), color.xy);
              } else {
                value = color.xy;
              }

              return atan2(value.y, value.x) / RASTER_PI / 2. + 0.5;
            } else {
              return 0.;
            }
          }

          vec4 raster_apply_opacity(vec3 color, float alpha) {
            return mix(vec4(0.), vec4(color, 1.), alpha);
          }
        `,
        'fs:#main-end': `
          ${(parentShaders.inject || {})['fs:#main-end'] || ''}
          if (imageWeight > 0.) {
            bitmapColor = mix(bitmapColor, texture2D(bitmapTexture2, uv), imageWeight);
          }

          // drop nodata
          if (!hasValues(bitmapColor)) {
            discard;
          }

          float colormapValue = raster_get_colormap_value(bitmapColor);
          vec4 rasterColor = texture2D(colormapImage, vec2(colormapValue, 0.));
          gl_FragColor = raster_apply_opacity(rasterColor.rgb, rasterColor.a * rasterOpacity);

          if (picking_uActive) {
            float directionValue = raster_get_direction_value(bitmapColor);
            gl_FragColor = vec4(colormapValue, directionValue, 0, 1);
          }
        `
      },
    };
  }

  draw(opts) {
    const {model} = this.state;
    const {image, image2, imageWeight, imageType, imageBounds, colormapImage, colormapBounds, rasterOpacity} = this.props;

    if (!image) {
      return;
    }
    if (!colormapImage) {
      return;
    }

    const imageUnscale = image.type !== GL.FLOAT ? 1 : 0;

    if (model) {
      model.setUniforms({
        bitmapTexture: image,
        bitmapTexture2: image2,
        imageWeight: image2 ? imageWeight : 0,
        imageType,
        imageUnscale,
        imageBounds,
        colormapImage,
        colormapBounds,
        rasterOpacity,
      });

      super.draw(opts);
    }
  }
}

RasterBitmapLayer.layerName = 'RasterBitmapLayer';
RasterBitmapLayer.defaultProps = defaultProps;