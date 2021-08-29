/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {BitmapLayer} from '@deck.gl/layers';
import GL from '@luma.gl/constants';

const DEFAULT_COLOR = [255, 255, 255, 255];

const defaultProps = {
  ...BitmapLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
  image2: {type: 'image', value: null},
  imageWeight: {type: 'number', value: 0},
  imageBounds: {type: 'array', value: null, required: true},
  imageType: {type: 'number', value: 0},

  delta: {type: 'number', required: true},
  color: {type: 'color', value: DEFAULT_COLOR},
  width: {type: 'number', value: 1},

  rasterOpacity: {type: 'number', min: 0, max: 1, value: 1},
};

export class ContourBitmapLayer extends BitmapLayer {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      vs: `#version 300 es\n${parentShaders.vs}`,
      fs: `#version 300 es\n${parentShaders.fs}`,
      inject: {
        ...parentShaders.inject,
        'fs:#decl': `
          ${(parentShaders.inject || {})['fs:#decl'] || ''}
          uniform sampler2D bitmapTexture2;
          uniform float imageWeight;
          uniform float imageType;
          uniform float imageUnscale;
          uniform vec2 imageBounds;
          uniform float delta;
          uniform vec4 color;
          uniform float width;
          uniform float rasterOpacity;

          bool isNan(float value) {
            return (value <= 0.0 || 0.0 <= value) ? false : true;
          }

          bool hasValues(vec4 values) {
            return !isNan(values.x) && values.a == 1.0;
          }

          float raster_get_value(vec4 color) {
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

            return value;
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

          float value = raster_get_value(bitmapColor);
          float contourValueFract = abs(fract(value / delta) - 0.5) * 2.;
          float contourValueFwidth = fwidth(value / delta);
          float contourValue = 1. - smoothstep(contourValueFwidth * 1., contourValueFwidth * 2., contourValueFract);
          vec4 rasterColor = vec4(color.rgb, contourValue);
          gl_FragColor = raster_apply_opacity(rasterColor.rgb, rasterColor.a * rasterOpacity);
        `
      },
    };
  }

  draw(opts) {
    const {model} = this.state;
    const {image, image2, imageWeight, imageType, imageBounds, delta, color, width, rasterOpacity} = this.props;

    if (!image) {
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
        delta,
        color: [color[0], color[1], color[2], (color[3] ?? 255)].map(d => d / 255),
        width,
        rasterOpacity,
      });

      super.draw(opts);
    }
  }
}

ContourBitmapLayer.layerName = 'ContourBitmapLayer';
ContourBitmapLayer.defaultProps = defaultProps;