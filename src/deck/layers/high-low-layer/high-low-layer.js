import {CompositeLayer} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import Supercluster from 'supercluster';
import {withCheckLicense} from '../../../_utils/license';
import {ImageType} from '../../../_utils/image-type';
import {unscaleTextureData} from '../../../_utils/data';
import {getHighsLows} from '../../../_utils/high-low-proxy';

const DEFAULT_TEXT_COLOR = [107, 107, 107, 255];
const DEFAULT_TEXT_OUTLINE_COLOR = [13, 13, 13, 255];
const DEFAULT_TEXT_SIZE = 12;

const defaultProps = {
  ...TextLayer.defaultProps,

  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  radius: {type: 'number', value: null, required: true},

  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  formatValueFunction: {type: 'function', value: x => x.toString()},

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

@withCheckLicense
class HighLowLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {textColor, textOutlineColor, textSize, formatValueFunction} = this.props;
    const {highsLows, visibleHighsLows} = this.state;
    const isGlobeViewport = !!viewport.resolution;

    if (!highsLows) {
      return [];
    }

    return [
      new TextLayer(this.props, this.getSubLayerProps({
        id: 'type',
        data: visibleHighsLows,
        getPixelOffset: [0, (isGlobeViewport ? -1 : 1) * -7],
        getPosition: d => d.geometry.coordinates,
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
        data: visibleHighsLows,
        getPixelOffset: [0, (isGlobeViewport ? -1 : 1) * 7],
        getPosition: d => d.geometry.coordinates,
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

  shouldUpdateState({changeFlags}) {
    return super.shouldUpdateState({changeFlags}) || changeFlags.viewportChanged;
  }

  updateState({props, oldProps, changeFlags}) {
    const {image, imageUnscale, radius} = props;

    super.updateState({props, oldProps, changeFlags});

    if (imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    if (image !== oldProps.image || radius !== oldProps.radius) {
      this.updateHighsLows();
    }

    if (changeFlags.viewportChanged) {
      this.updateVisibleHighsLows();
    }
  }

  async updateHighsLows() {
    const {image, imageType, imageUnscale, radius, bounds} = this.props;
    if (!image) {
      return;
    }

    const unscaledTextureData = unscaleTextureData(image, imageType, imageUnscale);
    const {data, width, height} = unscaledTextureData;
    const highsLows = await getHighsLows(data, width, height, radius, bounds);

    this.setState({ image, radius, highsLows });

    this.updateHighsLowsIndex();
  }

  updateHighsLowsIndex() {
    const {highsLows} = this.state;

    const highsLowsIndex = new Supercluster({
      radius: 40,
      maxZoom: 16
    });
    highsLowsIndex.load(highsLows);

    this.setState({ highsLowsIndex });

    this.updateVisibleHighsLows();
  }

  updateVisibleHighsLows() {
    const {viewport} = this.context;
    const {highsLowsIndex} = this.state;

    if (!highsLowsIndex) {
      return;
    }

    const visibleHighsLows = highsLowsIndex.getClusters([-180, -90, 180, 90], Math.floor(viewport.zoom)).filter(x => !x.properties.cluster);

    this.setState({ visibleHighsLows });
  }
}

HighLowLayer.layerName = 'HighLowLayer';
HighLowLayer.defaultProps = defaultProps;

export {HighLowLayer};