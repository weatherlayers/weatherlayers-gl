/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {BitmapLayer} from '@deck.gl/layers';

const defaultProps = {
  ...BitmapLayer.defaultProps,

  image2: {type: 'image', value: null, async: true},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'number', value: 0},
  colormapImage: {type: 'image', value: null, async: true},

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
          uniform sampler2D bitmapTexture2;
          uniform float bitmapTextureWeight;

          uniform float imageType;
          uniform sampler2D colormapImage;
          uniform float rasterOpacity;

          float raster_get_value(vec4 color) {
            if (imageType > 0.5) {
              return length(color.rg * 2. - 1.);
            } else {
              return color.r;
            }
          }

          vec4 raster_apply_opacity(vec3 color, float alpha) {
            return mix(vec4(0.), vec4(color, 1.), alpha);
          }
        `,
        'fs:#main-end': `
          ${(parentShaders.inject || {})['fs:#main-end'] || ''}
          if (bitmapTextureWeight > 0.) {
            bitmapColor = mix(bitmapColor, texture2D(bitmapTexture2, uv), bitmapTextureWeight);
          }
          if (bitmapColor.a != 1.) {
            discard;
          }

          float value = raster_get_value(bitmapColor);
          vec4 rasterColor = texture2D(colormapImage, vec2(value, 0.));
          gl_FragColor = raster_apply_opacity(rasterColor.rgb, rasterColor.a * rasterOpacity);

          if (picking_uActive) {
            gl_FragColor = bitmapColor;
          }
        `
      },
    };
  }

  draw(opts) {
    const {model} = this.state;
    const {image, image2, imageWeight, imageType, colormapImage, rasterOpacity} = this.props;

    if (!image) {
      return;
    }
    if (!colormapImage) {
      return;
    }

    if (model) {
      model.setUniforms({
        bitmapTexture2: image2,
        bitmapTextureWeight: image2 ? imageWeight : 0,
        imageType: imageType,
        colormapImage: colormapImage,
        rasterOpacity: rasterOpacity,
      });

      super.draw(opts);
    }
  }
}

RasterBitmapLayer.layerName = 'RasterBitmapLayer';
RasterBitmapLayer.defaultProps = defaultProps;