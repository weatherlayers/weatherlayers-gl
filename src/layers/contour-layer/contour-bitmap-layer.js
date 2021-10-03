/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {BitmapLayer} from '@deck.gl/layers';
import GL from '@luma.gl/constants';
import fsDecl from './contour-bitmap-layer-fs-decl.glsl';
import fsMainEnd from './contour-bitmap-layer-fs-main-end.glsl';
import {ImageType} from '../../utils/image-type';

const DEFAULT_COLOR = [255, 255, 255, 255];

const defaultProps = {
  ...BitmapLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
  image2: {type: 'image', value: null},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageBounds: {type: 'array', value: null, required: true},

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
      vs: ['#version 300 es', parentShaders.vs].join('\n'),
      fs: ['#version 300 es', parentShaders.fs].join('\n'),
      inject: {
        ...parentShaders.inject,
        'fs:#decl': [parentShaders.inject?.['fs:#decl'], fsDecl].join('\n'),
        'fs:#main-end': [parentShaders.inject?.['fs:#main-end'], fsMainEnd].join('\n'),
      },
    };
  }

  draw(opts) {
    const {model} = this.state;
    const {image, image2, imageWeight, imageType, imageBounds, delta, color, width, rasterOpacity} = this.props;

    if (!image) {
      return;
    }

    const imageScalarize = imageType === ImageType.VECTOR;
    const imageUnscale = image.type !== GL.FLOAT ? 1 : 0;

    if (model) {
      model.setUniforms({
        bitmapTexture: image,
        bitmapTexture2: image2,
        imageWeight: image2 ? imageWeight : 0,
        imageScalarize,
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