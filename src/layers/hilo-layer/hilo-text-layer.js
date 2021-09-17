/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer, TextLayer} from '@deck.gl/layers';
import {loadImageData, unscaleImageData} from '../../utils/image-data';
import {getHighsLows} from '../../utils/hilo-proxy';

const DEFAULT_COLOR = [107, 107, 107, 255];
const DEFAULT_OUTLINE_COLOR = [13, 13, 13, 255];

const defaultProps = {
  ...TextLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
  imageBounds: {type: 'array', value: null, required: true},

  radius: {type: 'number', value: null, required: true},

  color: {type: 'color', value: DEFAULT_COLOR},
  outlineColor: {type: 'color', value: DEFAULT_OUTLINE_COLOR},
  formatValueFunction: {type: 'function', value: x => x.toString()},

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

export class HiloTextLayer extends CompositeLayer {
  renderLayers() {
    if (this.props.visible && (this.props.image !== this.state.image || this.props.radius !== this.state.radius)) {
      this.updateHighsLows();
    }

    const {viewport} = this.context;
    const {color, outlineColor, formatValueFunction} = this.props;
    const {highsLows} = this.state;
    const isGlobeViewport = !!viewport.resolution;

    if (!highsLows) {
      return [];
    }

    return [
      new TextLayer(this.props, this.getSubLayerProps({
        id: 'type',
        data: highsLows,
        getPixelOffset: [0, (isGlobeViewport ? -1 : 1) * -7],
        getPosition: d => d.coordinates,
        getText: d => d.properties.type,
        getSize: 12,
        getColor: color,
        getAngle: isGlobeViewport ? 180 : 0,
        outlineColor,
        outlineWidth: 1,
        fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
        fontSettings: { sdf: true },
        billboard: false,
      })),
      new TextLayer(this.props, this.getSubLayerProps({
        id: 'value',
        data: highsLows,
        getPixelOffset: [0, (isGlobeViewport ? -1 : 1) * 7],
        getPosition: d => d.coordinates,
        getText: d => formatValueFunction(d.properties.value),
        getSize: 10,
        getColor: color,
        getAngle: isGlobeViewport ? 180 : 0,
        outlineColor,
        outlineWidth: 1,
        fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
        fontSettings: { sdf: true },
        billboard: false,
      })),
    ];
  }

  async updateHighsLows() {
    const {image, imageBounds, radius, bounds} = this.props;

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
    const highsLows = await getHighsLows(data, width, height, radius, bounds);

    this.setState({
      image,
      radius,
      highsLows,
    });
  }
}

HiloTextLayer.layerName = 'HiloTextLayer';
HiloTextLayer.defaultProps = defaultProps;