/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import {ImageType} from '../../../_utils/image-type';
import {unscaleTextureData} from '../../../_utils/data';
import {getHighsLows} from '../../../_utils/high-low-proxy';

const DEFAULT_TEXT_COLOR = [107, 107, 107, 255];
const DEFAULT_TEXT_OUTLINE_COLOR = [13, 13, 13, 255];
const DEFAULT_TEXT_SIZE = 12;

const defaultProps = {
  ...TextLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageBounds: {type: 'array', value: null, required: true},

  radius: {type: 'number', value: null, required: true},

  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  formatValueFunction: {type: 'function', value: x => x.toString()},

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

export class HighLowLayer extends CompositeLayer {
  renderLayers() {
    if (this.props.visible && (this.props.image !== this.state.image || this.props.radius !== this.state.radius)) {
      this.updateHighsLows();
    }

    const {viewport} = this.context;
    const {textColor, textOutlineColor, textSize, formatValueFunction} = this.props;
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
        getSize: 1.2 * textSize,
        getColor: textColor,
        getAngle: isGlobeViewport ? 180 : 0,
        outlineColor: textOutlineColor,
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
        getSize: textSize,
        getColor: textColor,
        getAngle: isGlobeViewport ? 180 : 0,
        outlineColor: textOutlineColor,
        outlineWidth: 1,
        fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
        fontSettings: { sdf: true },
        billboard: false,
      })),
    ];
  }

  async updateHighsLows() {
    const {image, imageType, imageBounds, radius, bounds} = this.props;

    if (!image) {
      return;
    }

    const unscaledTextureData = unscaleTextureData(image, imageType, imageBounds);
    const {data, width, height} = unscaledTextureData;
    const highsLows = await getHighsLows(data, width, height, radius, bounds);

    this.setState({
      image,
      radius,
      highsLows,
    });
  }
}

HighLowLayer.layerName = 'HighLowLayer';
HighLowLayer.defaultProps = defaultProps;