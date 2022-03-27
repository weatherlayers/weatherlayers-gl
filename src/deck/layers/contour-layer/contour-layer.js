import {CompositeLayer} from '@deck.gl/core';
import {PathLayer, TextLayer} from '@deck.gl/layers';
import {ImageType} from '../../../_utils/image-type';
import {getViewportAngle} from '../../../_utils/viewport';
import {getViewportVisiblePoints} from '../../../_utils/viewport-point';
import {unscaleTextureData} from '../../../_utils/data';
import {withCheckLicense} from '../../license';
import {DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR, DEFAULT_TEXT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../../props';
import {getContourLines} from './contour-line';
import {getContourLabels} from './contour-label';

const defaultProps = {
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  delta: {type: 'number', value: null, required: true},
  width: {type: 'number', value: DEFAULT_LINE_WIDTH},
  color: {type: 'color', value: DEFAULT_LINE_COLOR},
  textFunction: {type: 'function', value: DEFAULT_TEXT_FUNCTION},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

@withCheckLicense(defaultProps)
class ContourLayer extends CompositeLayer {
  static defaultProps = defaultProps;

  renderLayers() {
    const {viewport} = this.context;
    const {props, contourLines, visibleContourLabels} = this.state;

    if (!props || !contourLines) {
      return [];
    }

    const {color, width, textFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor} = props;

    return [
      new PathLayer(this.getSubLayerProps({
        id: 'path',
        data: contourLines,
        widthUnits: 'pixels',
        getPath: d => d.geometry.coordinates,
        getColor: color,
        getWidth: width,
      })),
      new TextLayer(this.getSubLayerProps({
        id: 'value',
        data: visibleContourLabels,
        getPosition: d => d.geometry.coordinates,
        getText: d => textFunction(d.properties.value),
        getSize: textSize,
        getColor: textColor,
        getAngle: d => getViewportAngle(viewport, d.properties.angle),
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
    const {image, imageUnscale, delta} = props;

    super.updateState({props, oldProps, changeFlags});

    if (imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    if (!delta) {
      this.setState({
        contourLabels: undefined,
        visibleContourLabels: undefined,
      });
      return;
    }

    if (image !== oldProps.image || delta !== oldProps.delta) {
      this.updateContourLines();
    }

    if (changeFlags.viewportChanged) {
      this.updateVisibleContourLabels();
    }

    this.setState({ props });
  }

  async updateContourLines() {
    const {image, imageType, imageUnscale, delta, bounds} = this.props;
    if (!image) {
      return;
    }

    const unscaledData = unscaleTextureData(image, imageUnscale);
    const contourLines = await getContourLines(unscaledData, imageType, delta, bounds);
    const contourLabels = getContourLabels(contourLines);

    this.setState({ image, delta, contourLines, contourLabels });

    this.updateVisibleContourLabels();
  }

  updateVisibleContourLabels() {
    const {viewport} = this.context;
    const {contourLabels} = this.state;
    if (!contourLabels) {
      return;
    }

    const visibleContourLabels = getViewportVisiblePoints(viewport, contourLabels);

    this.setState({ visibleContourLabels });
  }
}

ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;

export {ContourLayer};