/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {BitmapLayer} from '@deck.gl/layers';
import GL from '@luma.gl/constants';
import {code as fsDecl, tokens as fsDeclTokens} from './contour-gpu-layer-fs-decl.glsl';
import {code as fsMainEnd} from './contour-gpu-layer-fs-main-end.glsl';
import {withCheckLicense} from '../../../_utils/license';
import {ImageType} from '../../../_utils/image-type';

const DEFAULT_COLOR = [255, 255, 255, 255];

const defaultProps = {
  ...BitmapLayer.defaultProps,

  image: {type: 'image', value: null, async: true, required: true},
  image2: {type: 'image', value: null, async: true},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  delta: {type: 'number', required: true},
  color: {type: 'color', value: DEFAULT_COLOR},
  width: {type: 'number', value: 1},

  rasterOpacity: {type: 'number', min: 0, max: 1, value: 1},
};

@withCheckLicense
class ContourGpuLayer extends BitmapLayer {
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
    const {image, image2, imageWeight, imageType, imageUnscale, delta, color, width, rasterOpacity} = this.props;

    if (!image) {
      return;
    }
    if (imageUnscale && !(image.format === GL.RGBA || image.format === GL.LUMINANCE_ALPHA)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    const imageScalarize = imageType === ImageType.VECTOR;

    if (model) {
      model.setUniforms({
        bitmapTexture: image,
        [fsDeclTokens.bitmapTexture2]: image2,
        [fsDeclTokens.imageWeight]: image2 ? imageWeight : 0,
        [fsDeclTokens.imageScalarize]: imageScalarize,
        [fsDeclTokens.imageUnscale]: imageUnscale || [0, 0],
        [fsDeclTokens.delta]: delta,
        [fsDeclTokens.color]: [color[0], color[1], color[2], (color[3] ?? 255)].map(d => d / 255),
        [fsDeclTokens.width]: width,
        [fsDeclTokens.rasterOpacity]: rasterOpacity,
      });

      super.draw(opts);
    }
  }
}

ContourGpuLayer.layerName = 'ContourGpuLayer';
ContourGpuLayer.defaultProps = defaultProps;

export {ContourGpuLayer};