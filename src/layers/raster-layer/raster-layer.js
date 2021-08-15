/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {ImageType} from './image-type';
import {RasterBitmapLayer} from './raster-bitmap-layer';

const defaultProps = {
  ...RasterBitmapLayer.defaultProps,

  rasterOpacity: undefined,
};

export class RasterLayer extends CompositeLayer {
  renderLayers() {
    const {opacity} = this.props;

    // apply gamma to opacity to make it visually "linear"
    const rasterOpacity = Math.pow(opacity, 1 / 2.2);

    return [
      new RasterBitmapLayer(this.getSubLayerProps({
        ...this.props,
        id: 'bitmap',
        // pass textures manually, because they are getters
        image: this.props.image,
        image2: this.props.image2,
        // apply opacity in RasterBitmapLayer
        opacity: 1,
        rasterOpacity,
      })),
    ];
  }

  isRasterVector() {
    return this.props.imageType === ImageType.VECTOR;
  }

  getRasterValue(color) {
    const {colormapBreaks} = this.props;

    const colormapBounds = /** @type {[number, number]} */ ([colormapBreaks[0][0], colormapBreaks[colormapBreaks.length - 1][0]]);

    return colormapBounds[0] + color[0] / 255 * (colormapBounds[1] - colormapBounds[0]);
  }

  getRasterDirection(color) {
    if (this.isRasterVector()) {
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

RasterLayer.layerName = 'RasterLayer';
RasterLayer.defaultProps = defaultProps;