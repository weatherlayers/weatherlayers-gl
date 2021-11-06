/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';
import {ImageType} from '../../../_utils/image-type';
import {unscaleTextureData} from '../../../_utils/data';
import {getContours} from '../../../_utils/contour-proxy';

const DEFAULT_COLOR = [255, 255, 255, 255];

const defaultProps = {
  ...PathLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageBounds: {type: 'array', value: null, required: true},

  delta: {type: 'number', value: null, required: true},
  color: {type: 'color', value: DEFAULT_COLOR},
  width: {type: 'number', value: 1},

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

export class ContourPathLayer extends CompositeLayer {
  renderLayers() {
    if (this.props.visible && (this.props.image !== this.state.image || this.props.delta !== this.state.delta)) {
      this.updateContours();
    }

    const {color, width} = this.props;
    const {contours} = this.state;

    if (!contours) {
      return [];
    }

    return [
      new PathLayer(this.props, this.getSubLayerProps({
        id: 'path',
        data: contours,
        widthUnits: 'pixels',
        getPath: d => d.coordinates,
        getColor: color,
        getWidth: width,
      })),
    ];
  }

  async updateContours() {
    const {image, imageType, imageBounds, delta, bounds} = this.props;

    if (!image) {
      return;
    }

    const unscaledTextureData = unscaleTextureData(image, imageType, imageBounds);
    const {data, width, height} = unscaledTextureData;
    const contours = await getContours(data, width, height, delta, bounds);

    this.setState({
      image,
      delta,
      contours,
    });
  }
}

ContourPathLayer.layerName = 'ContourPathLayer';
ContourPathLayer.defaultProps = defaultProps;