import {CompositeLayer} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import KDBush from 'kdbush';
import geokdbush from 'geokdbush';
import {ImageType} from '../../../_utils/image-type';
import {isViewportGlobe, getViewportGlobeCenter, getViewportGlobeRadius, getViewportBounds, getViewportPixelOffset, getViewportAngle} from '../../../_utils/viewport';
import {unscaleTextureData} from '../../../_utils/data';
import {withCheckLicense} from '../../license';
import {DEFAULT_TEXT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../../props';
import {getHighLowPoints} from './high-low-point';

/** @typedef {import('./high-low-point').HighLowPoint} HighLowPoint */

const CLUSTER_RADIUS = 40;

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

    // find visible points
    /** @type {HighLowPoint[]} */
    let viewportHighLowPoints;
    const globalIndex = new KDBush(highLowPoints, x => x.geometry.coordinates[0], x => x.geometry.coordinates[1], undefined, Float32Array);
    if (isViewportGlobe(viewport)) {
      const viewportGlobeCenter = /** @type {GeoJSON.Position} */ (getViewportGlobeCenter(viewport));
      const viewportGlobeRadius = /** @type {number} */ (getViewportGlobeRadius(viewport));
      viewportHighLowPoints = geokdbush.around(globalIndex, viewportGlobeCenter[0], viewportGlobeCenter[1], undefined, viewportGlobeRadius / 1000);
    } else {
      const viewportBounds = /** @type {GeoJSON.BBox} */ (getViewportBounds(viewport));
      viewportHighLowPoints = [
        ...globalIndex.range(viewportBounds[0], viewportBounds[1], viewportBounds[2], viewportBounds[3]).map(i => highLowPoints[i]),
        ...globalIndex.range(viewportBounds[0] - 360, viewportBounds[1], viewportBounds[2] - 360, viewportBounds[3]).map(i => highLowPoints[i]),
      ];
    }
    /** @type {HighLowPoint[]} */
    let visibleHighLowPoints = highLowPoints.map(x => viewportHighLowPoints.includes(x) ? x : undefined);

    // remove proximate points
    const localIndexViewport = new viewport.constructor({ ...viewport, zoom: Math.floor(viewport.zoom) });
    const localIndex = new KDBush(viewportHighLowPoints.map(x => localIndexViewport.project(x.geometry.coordinates)), undefined, undefined, undefined, Float32Array);
    for (let i = 0; i < visibleHighLowPoints.length; i++) {
      const highLowPoint = visibleHighLowPoints[i];
      if (highLowPoint) {
        const point = localIndexViewport.project(highLowPoint.geometry.coordinates);
        const closeHighLowPoints = localIndex.within(point[0], point[1], CLUSTER_RADIUS).map(i => viewportHighLowPoints[i]);
        for (let j = i + 1; j < visibleHighLowPoints.length; j++) {
          const highLowPoint2 = visibleHighLowPoints[j];
          if (highLowPoint2 && closeHighLowPoints.includes(highLowPoint2)) {
            visibleHighLowPoints[j] = undefined;
          }
        }
      }
    }
    visibleHighLowPoints = visibleHighLowPoints.filter(x => !!x);

    this.setState({ visibleHighLowPoints });
  }
}

HighLowLayer.layerName = 'HighLowLayer';
HighLowLayer.defaultProps = defaultProps;

export {HighLowLayer};