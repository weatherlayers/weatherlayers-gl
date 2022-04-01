import {CompositeLayer} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import {DEFAULT_TEXT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../../../_utils/props';
import {ImageType} from '../../../_utils/image-type';
import {getViewportPixelOffset, getViewportAngle} from '../../../_utils/viewport';
import {getViewportVisiblePoints} from '../../../_utils/viewport-point';
import {unscaleTextureData} from '../../../_utils/data';
import {withCheckLicense} from '../../license';
import {getHighLowPoints} from '../../../standalone/providers/high-low-provider/high-low-point';

const defaultProps = {
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  radius: {type: 'number', value: null, required: true},

  textFunction: {type: 'function', value: DEFAULT_TEXT_FUNCTION},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

@withCheckLicense(defaultProps)
class HighLowLayer extends CompositeLayer {
  static defaultProps = defaultProps;

  renderLayers() {
    const {viewport} = this.context;
    const {props, highLowPoints, visibleHighLowPoints} = this.state;

    if (!props || !highLowPoints) {
      return [];
    }

    const {textFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor} = props;

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
        getText: d => textFunction(d.properties.value),
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
    const {image, imageUnscale, radius} = props;

    super.updateState({props, oldProps, changeFlags});

    if (imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

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

    const unscaledData = unscaleTextureData(image, imageUnscale);
    const highLowPoints = await getHighLowPoints(unscaledData, imageType, radius, bounds);

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

HighLowLayer.layerName = 'HighLowLayer';
HighLowLayer.defaultProps = defaultProps;

export {HighLowLayer};