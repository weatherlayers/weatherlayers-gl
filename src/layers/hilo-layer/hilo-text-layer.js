/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer, TextLayer} from '@deck.gl/layers';
import {getHighsLows} from '../../utils/hilo';

/**
 * @param {ImageBitmap | HTMLImageElement} image
 * @returns {ImageData}
 */
function loadImageData(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return imageData;
}

/**
 * unscale 8bit grayscale image back to original data
 * @param {ImageData} imageData
 * @param {[number, number]} imageBounds
 * @returns {{ width: number, height: number, data: Float32Array }}
 */
function unscaleImageData(imageData, imageBounds) {
  const {width, height, data} = imageData;

  const unscaledData = new Float32Array(
    Array.from(data)
      .filter((_, i) => i % 4 === 0)
      .map(x => x / 255 * (imageBounds[1] - imageBounds[0]) + imageBounds[0])
  );

  return { width, height, data: unscaledData };
}

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

  updateHighsLows() {
    const {image, imageBounds, radius} = this.props;

    if (!image) {
      return;
    }

    let imageData;
    if (image instanceof ImageBitmap || image instanceof HTMLImageElement) {
      imageData = loadImageData(image);
      imageData = unscaleImageData(imageData, imageBounds);
    } else {
      imageData = image;
    }

    const highsLows = getHighsLows(imageData, radius);

    this.setState({
      image,
      radius,
      highsLows,
    });
  }
}

HiloTextLayer.layerName = 'HiloTextLayer';
HiloTextLayer.defaultProps = defaultProps;