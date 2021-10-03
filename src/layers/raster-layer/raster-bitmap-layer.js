/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {BitmapLayer} from '@deck.gl/layers';
import {Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import fsDecl from './raster-bitmap-layer-fs-decl.glsl';
import fsMainEnd from './raster-bitmap-layer-fs-main-end.glsl';
import {ImageType} from '../../utils/image-type';
import {linearColormap, colorRampImage} from '../../utils/colormap';

const defaultProps = {
  ...BitmapLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
  image2: {type: 'image', value: null},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageBounds: {type: 'array', value: null, required: true},

  colormapBreaks: {type: 'array', value: null, required: true},

  rasterOpacity: {type: 'number', min: 0, max: 1, value: 1},
};

export class RasterBitmapLayer extends BitmapLayer {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      inject: {
        ...parentShaders.inject,
        'fs:#decl': [parentShaders.inject?.['fs:#decl'], fsDecl].join('\n'),
        'fs:#main-end': [parentShaders.inject?.['fs:#main-end'], fsMainEnd].join('\n'),
      },
    };
  }

  updateState({props, oldProps, changeFlags}) {
    const {gl} = this.context;
    const {colormapBreaks} = props;

    super.updateState({props, oldProps, changeFlags});

    if (colormapBreaks !== oldProps.colormapBreaks) {
      const colormapBounds = /** @type {[number, number]} */ ([colormapBreaks[0][0], colormapBreaks[colormapBreaks.length - 1][0]]);
      const colormapFunction = linearColormap(colormapBreaks);
      const colormapImage = colorRampImage(colormapFunction, colormapBounds);
      const colormapTexture = new Texture2D(gl, {
        data: colormapImage,
        parameters: {
          [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
          [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
          [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
          [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
        },
      });

      this.setState({
        colormapTexture,
        colormapBounds,
      });
    }
  }

  draw(opts) {
    const {model} = this.state;
    const {image, image2, imageWeight, imageType, imageBounds, rasterOpacity} = this.props;
    const {colormapTexture, colormapBounds} = this.state;

    if (!image || !colormapTexture) {
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
        colormapTexture,
        colormapBounds,
        rasterOpacity,
      });

      super.draw(opts);
    }
  }

  getRasterValue(color) {
    const {colormapBreaks} = this.props;
    const colormapBounds = /** @type {[number, number]} */ ([colormapBreaks[0][0], colormapBreaks[colormapBreaks.length - 1][0]]);
    return colormapBounds[0] + color[0] / 255 * (colormapBounds[1] - colormapBounds[0]);
  }

  getRasterDirection(color) {
    const {imageType} = this.props;
    if (imageType === ImageType.VECTOR) {
      return (color[1] / 255 - 0.5) * 2 * Math.PI;
    }
  }

  getPickingInfo({info}) {
    if (!info.color) {
      return info;
    }

    const value = this.getRasterValue(info.color);
    const direction = this.getRasterDirection(info.color);

    info.raster = {
      value,
      direction,
    };

    return info;
  }
}

RasterBitmapLayer.layerName = 'RasterBitmapLayer';
RasterBitmapLayer.defaultProps = defaultProps;