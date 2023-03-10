import {CompositeLayer} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import {CollisionFilterExtension} from '@deck.gl/extensions';
import {DEFAULT_TEXT_FORMAT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../../../_utils/props.js';
import {ImageType} from '../../../_utils/image-type.js';
import {getViewportPixelOffset, getViewportAngle} from '../../../_utils/viewport.js';
import {getHighLowPoints} from '../../../standalone/providers/high-low-provider/high-low-point.js';

/** @typedef {import('../../../standalone/providers/high-low-provider/high-low-point.js').HighLowPointProperties} HighLowPointProperties */

/**
 * @param {GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>} highLowPoint
 * @param {number} minValue
 * @param {number} maxValue
 * @returns {number}
 */
function getHighLowPointCollisionPriority(highLowPoint, minValue, maxValue) {
  if (highLowPoint.properties.type === 'H') {
    return Math.round((highLowPoint.properties.value - maxValue) / maxValue * 100);
  } else {
    return Math.round((minValue - highLowPoint.properties.value) / minValue * 100);
  }
}

const defaultProps = {
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},

  radius: {type: 'number', value: null, required: true},

  unitFormat: {type: 'object', value: null},
  textFormatFunction: {type: 'function', value: DEFAULT_TEXT_FORMAT_FUNCTION},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
};

class HighLowCompositeLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {props, highLowPoints, minValue, maxValue} = this.state;

    if (!props || !highLowPoints) {
      return [];
    }

    const {unitFormat, textFormatFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor} = props;

    return [
      new TextLayer(this.getSubLayerProps({
        id: 'type',
        data: highLowPoints,
        getPixelOffset: [0, -getViewportPixelOffset(viewport, (textSize * 1.2) / 2)],
        getPosition: d => d.geometry.coordinates,
        getText: d => d.properties.type,
        getSize: textSize * 1.2,
        getColor: textColor,
        getAngle: getViewportAngle(viewport, 0),
        outlineWidth: textOutlineWidth,
        outlineColor: textOutlineColor,
        fontFamily: textFontFamily,
        fontSettings: { sdf: true },
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionTestProps: {sizeScale: 5},
        getCollisionPriority: d => getHighLowPointCollisionPriority(d, minValue, maxValue),
      })),
      new TextLayer(this.getSubLayerProps({
        id: 'value',
        data: highLowPoints,
        getPixelOffset: [0, getViewportPixelOffset(viewport, (textSize * 1.2) / 2)],
        getPosition: d => d.geometry.coordinates,
        getText: d => textFormatFunction(d.properties.value, unitFormat),
        getSize: textSize,
        getColor: textColor,
        getAngle: getViewportAngle(viewport, 0),
        outlineWidth: textOutlineWidth,
        outlineColor: textOutlineColor,
        fontFamily: textFontFamily,
        fontSettings: { sdf: true },
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionTestProps: {sizeScale: 5},
        getCollisionPriority: d => getHighLowPointCollisionPriority(d, minValue, maxValue),
      })),
    ];
  }

  shouldUpdateState({changeFlags}) {
    return super.shouldUpdateState({changeFlags}) || changeFlags.viewportChanged;
  }

  updateState({props, oldProps, changeFlags}) {
    const {image, radius} = props;

    super.updateState({props, oldProps, changeFlags});

    if (!radius) {
      this.setState({
        highLowPoints: undefined,
        minValue: undefined,
        maxValue: undefined,
      });
      return;
    }

    if (image !== oldProps.image || radius !== oldProps.radius) {
      this.updateHighLowPoints();
    }

    this.setState({ props });
  }

  async updateHighLowPoints() {
    const {image, imageType, imageUnscale, bounds, radius} = this.props;
    if (!image) {
      return;
    }

    const highLowPoints = (await getHighLowPoints(image, imageType, imageUnscale, bounds, radius)).features;
    const values = highLowPoints.map(highLowPoint => highLowPoint.properties.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    this.setState({ image, radius, highLowPoints, minValue, maxValue });
  }
}

HighLowCompositeLayer.layerName = 'HighLowCompositeLayer';
HighLowCompositeLayer.defaultProps = defaultProps;

export {HighLowCompositeLayer};