/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer, PathLayer, TextLayer} from '@deck.gl/layers';
import {getContoursAndExtremities} from '../../utils/contour';

const DEFAULT_COLOR = [255, 255, 255, 255];

const defaultProps = {
  ...PathLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
  imageBounds: {type: 'array', value: null, required: true},
  step: {type: 'number', value: null, required: true},

  color: {type: 'color', value: DEFAULT_COLOR},
  width: {type: 'number', value: 1},
  hiloEnabled: {type: 'boolean', value: false},
};

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

export class ContourCompositeLayer extends CompositeLayer {
  renderLayers() {
    if (this.props.visible && (this.props.image !== this.state.image || this.props.step !== this.state.step)) {
      this.updateContoursAndExtremities();
    }

    const {color, width, hiloEnabled} = this.props;
    const {contours, extremities} = this.state;

    if (!contours || !extremities) {
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
      new TextLayer(this.props, this.getSubLayerProps({
        id: 'hilo-type',
        visible: hiloEnabled,
        data: extremities,
        getPosition: d => d.coordinates,
        getText: d => d.properties.type,
        getSize: 12,
        getColor: [0, 0, 0],
        outlineColor: [192, 192, 192],
        outlineWidth: 1,
        fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
        fontSettings: { sdf: true },
        opacity: 1,
      })),
      new TextLayer(this.props, this.getSubLayerProps({
        id: 'hilo-value',
        visible: hiloEnabled,
        data: extremities,
        getPosition: d => d.coordinates,
        getText: d => d.properties.valueFormatted,
        getSize: 10,
        getColor: [0, 0, 0],
        getPixelOffset: [0, 14],
        outlineColor: [192, 192, 192],
        outlineWidth: 1,
        fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
        fontSettings: { sdf: true },
        opacity: 1,
      })),
    ];
  }

  updateContoursAndExtremities() {
    const {image, imageBounds, step} = this.props;

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

    const {contours, extremities} = getContoursAndExtremities(imageData, true, step);

    this.setState({
      image,
      step,
      contours,
      extremities,
    });
  }
}

ContourCompositeLayer.layerName = 'ContourCompositeLayer';
ContourCompositeLayer.defaultProps = defaultProps;