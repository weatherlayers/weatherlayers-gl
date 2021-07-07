/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {IMAGE_TYPE} from './image-type';
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
        colormapImage: this.props.colormapImage,
        // apply opacity in RasterBitmapLayer
        opacity: 1,
        rasterOpacity,
      })),
    ];
  }

  isRasterVector() {
    return this.props.imageType === IMAGE_TYPE.VECTOR;
  }

  getRasterValue(color) {
    if (this.isRasterVector()) {
      return Math.hypot(color[0] * 2 - 1, color[1] * 2 - 1);
    } else {
      return color[0];
    }
  }

  getRasterVectorValue(color) {
    if (this.isRasterVector()) {
      return [color[0], color[1]];
    }
  }

  getRasterVectorDirection(color) {
    if (this.isRasterVector()) {
      const θ = Math.atan2(color[1] * 2 - 1, color[0] * 2 - 1);
      return ((90 - θ / Math.PI * 180) + 360) % 360;
    }
  }

  getPickingInfo({info}) {
    if (!info.color) {
      return info;
    }

    const color = Array.from(info.color).map(x => x / 255);
    const value = this.getRasterValue(color);
    const vectorValue = this.getRasterVectorValue(color);
    const vectorDirection = this.getRasterVectorDirection(color);

    info.raster = {
      value,
      vectorValue,
      vectorDirection,
    };

    return info;
  }
}

RasterLayer.layerName = 'RasterLayer';
RasterLayer.defaultProps = defaultProps;