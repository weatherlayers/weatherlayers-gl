import {CompositeLayer} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import {DEFAULT_TEXT_FORMAT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../../../_utils/props';
import {ImageType} from '../../../_utils/image-type';
import {getViewportPixelOffset, getViewportAngle} from '../../../_utils/viewport';
import {getViewportVisiblePoints} from '../../../_utils/viewport-point';
import {getHighLowPoints} from '../../../standalone/providers/high-low-provider/high-low-point';

const defaultProps = {
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  radius: {type: 'number', value: null, required: true},

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
    const {props, highLowPoints, visibleHighLowPoints} = this.state;

    if (!props || !highLowPoints) {
      return [];
    }

    const {textFormatFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor} = props;

    return [
      new TextLayer(this.getSubLayerProps({
        id: 'type',
        data: visibleHighLowPoints,
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
      })),
      new TextLayer(this.getSubLayerProps({
        id: 'value',
        data: visibleHighLowPoints,
        getPixelOffset: [0, getViewportPixelOffset(viewport, (textSize * 1.2) / 2)],
        getPosition: d => d.geometry.coordinates,
        getText: d => textFormatFunction(d.properties.value),
        getSize: textSize,
        getColor: textColor,
        getAngle: getViewportAngle(viewport, 0),
        outlineWidth: textOutlineWidth,
        outlineColor: textOutlineColor,
        fontFamily: textFontFamily,
        fontSettings: { sdf: true },
        billboard: false,
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
        visibleHighLowPoints: undefined,
      });
      return;
    }

    if (image !== oldProps.image || radius !== oldProps.radius) {
      this.updateHighLowPoints();
    }

    if (changeFlags.viewportChanged) {
      this.updateVisibleHighLowPoints();
    }

    this.setState({ props });
  }

  async updateHighLowPoints() {
    const {image, imageType, imageUnscale, radius, bounds} = this.props;
    if (!image) {
      return;
    }

    const highLowPoints = await getHighLowPoints(image, imageType, imageUnscale, radius, bounds);

    this.setState({ image, radius, highLowPoints });

    this.updateVisibleHighLowPoints();
  }

  updateVisibleHighLowPoints() {
    const {viewport} = this.context;
    const {highLowPoints} = this.state;
    if (!highLowPoints) {
      return;
    }

    const visibleHighLowPoints = getViewportVisiblePoints(viewport, highLowPoints);

    this.setState({ visibleHighLowPoints });
  }
}

HighLowCompositeLayer.layerName = 'HighLowCompositeLayer';
HighLowCompositeLayer.defaultProps = defaultProps;

export {HighLowCompositeLayer};