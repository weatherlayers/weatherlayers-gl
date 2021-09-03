/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer, PathLayer} from '@deck.gl/layers';
import {getContours} from '../../utils/contour';

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

  updateContours() {
    const {image, imageBounds, delta, bounds} = this.props;

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

    const contours = getContours(imageData, delta, bounds);

    this.setState({
      image,
      delta,
      contours,
    });
  }
}

ContourPathLayer.layerName = 'ContourPathLayer';
ContourPathLayer.defaultProps = defaultProps;