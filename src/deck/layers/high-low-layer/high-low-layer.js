import {CompositeLayer} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import Supercluster from 'supercluster';
import KDBush from 'kdbush';
import geokdbush from 'geokdbush';
import {ImageType} from '../../../_utils/image-type';
import {isViewportGlobe, getViewportGlobeCenter, getViewportGlobeRadius, getViewportBounds, getViewportZoom, getViewportPixelOffset, getViewportAngle} from '../../../_utils/viewport';
import {unscaleTextureData} from '../../../_utils/data';
import {withCheckLicense} from '../../license';
import {DEFAULT_TEXT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../../props';
import {getHighLowPoints} from './high-low-point';

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
        highLowPointIndex: undefined,
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

    this.updateHighLowPointIndex();
  }

  updateHighLowPointIndex() {
    const {highLowPoints} = this.state;

    const highLowPointIndex = new Supercluster({
      radius: 40,
      maxZoom: 16
    });
    highLowPointIndex.load(highLowPoints);

    this.setState({ highLowPointIndex });

    this.updateVisibleHighLowPoints();
  }

  updateVisibleHighLowPoints() {
    const {viewport} = this.context;
    const {highLowPointIndex} = this.state;
    if (!highLowPointIndex) {
      return;
    }

    // viewport
    const viewportGlobeCenter = getViewportGlobeCenter(viewport);
    const viewportGlobeRadius = getViewportGlobeRadius(viewport);
    const viewportBounds = getViewportBounds(viewport);
    const zoom = Math.floor(getViewportZoom(viewport));
    let visibleHighLowPoints;
    // TODO: filter instead of clustering in supercluster
    if (isViewportGlobe(viewport)) {
      // TODO: fix cluster density near the poles, use geokdbush in supercluster
      visibleHighLowPoints = highLowPointIndex.getClusters([-180, -90, 180, 90], zoom).filter(x => !x.properties.cluster);
      const kdbushIndex = new KDBush(visibleHighLowPoints, x => x.geometry.coordinates[0], x => x.geometry.coordinates[1], undefined, Float32Array);
      visibleHighLowPoints = geokdbush.around(kdbushIndex, viewportGlobeCenter[0], viewportGlobeCenter[1], undefined, viewportGlobeRadius / 1000);
    } else {
      visibleHighLowPoints = highLowPointIndex.getClusters(viewportBounds, zoom).filter(x => !x.properties.cluster);
    }

    this.setState({ visibleHighLowPoints });
  }
}

HighLowLayer.layerName = 'HighLowLayer';
HighLowLayer.defaultProps = defaultProps;

export {HighLowLayer};