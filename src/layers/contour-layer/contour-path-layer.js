/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer, PathLayer} from '@deck.gl/layers';
import {loadImageData, unscaleImageData} from '../../utils/image-data';
import {getContours} from '../../utils/contour-proxy';

const DEFAULT_COLOR = [255, 255, 255, 255];

const defaultProps = {
  ...PathLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
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
    const {image, imageBounds, delta, bounds} = this.props;

    if (!image) {
      return;
    }

    let imageData;
    if (image.data instanceof HTMLImageElement) {
      const loadedData = loadImageData(image.data);
      imageData = { data: unscaleImageData(loadedData.data, imageBounds, 4), width: loadedData.width, height: loadedData.height };
    } else if (image.data instanceof Uint8Array) {
      imageData = { data: unscaleImageData(image.data, imageBounds, 2), width: image.width, height: image.height };
    } else if (image.data instanceof Float32Array) {
      imageData = { data: new Float32Array(image.data), width: image.width, height: image.height };
    } else {
      throw new Error('Unsupported data format');
    }

    const {data, width, height} = imageData;
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