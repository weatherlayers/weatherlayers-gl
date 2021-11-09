/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/core';
import {PathLayer, TextLayer} from '@deck.gl/layers';
import {ImageType} from '../../../_utils/image-type';
import {unscaleTextureData} from '../../../_utils/data';
import {getContours} from '../../../_utils/contour-proxy';
import {getContourLabels} from '../../../_utils/contour-label';

const DEFAULT_COLOR = [255, 255, 255, 255];
const DEFAULT_TEXT_COLOR = [107, 107, 107, 255];
const DEFAULT_TEXT_OUTLINE_COLOR = [13, 13, 13, 255];
const DEFAULT_TEXT_SIZE = 12;

const defaultProps = {
  ...PathLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageBounds: {type: 'array', value: null, required: true},

  delta: {type: 'number', value: null, required: true},
  color: {type: 'color', value: DEFAULT_COLOR},
  width: {type: 'number', value: 1},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  formatValueFunction: {type: 'function', value: x => x.toString()},

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

export class ContourLayer extends CompositeLayer {
  renderLayers() {
    if (this.props.visible && (this.props.image !== this.state.image || this.props.delta !== this.state.delta)) {
      this.updateContours();
    }

    const {viewport} = this.context;
    const {color, width, textColor, textOutlineColor, textSize, formatValueFunction} = this.props;
    const {contours, contourLabels} = this.state;
    const isGlobeViewport = !!viewport.resolution;

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
      new TextLayer(this.props, this.getSubLayerProps({
        id: 'value',
        data: contourLabels,
        getPosition: d => d.coordinates,
        getText: d => formatValueFunction(d.properties.value),
        getSize: textSize,
        getColor: textColor,
        getAngle: d => d.properties.angle + (isGlobeViewport ? 180 : 0),
        outlineColor: textOutlineColor,
        outlineWidth: 1,
        fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
        fontSettings: { sdf: true },
        billboard: false,
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
    const contourLabels = getContourLabels(contours);

    this.setState({
      image,
      delta,
      contours,
      contourLabels,
    });
  }
}

ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;