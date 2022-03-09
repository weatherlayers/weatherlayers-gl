import {CompositeLayer} from '@deck.gl/core';
import {PathLayer, TextLayer} from '@deck.gl/layers';
import Supercluster from 'supercluster';
import KDBush from 'kdbush';
import geokdbush from 'geokdbush';
import {ImageType} from '../../../_utils/image-type';
import {isViewportGlobe, getViewportGlobeCenter, getViewportGlobeRadius, getViewportBounds, getViewportZoom, getViewportAngle} from '../../../_utils/viewport';
import {unscaleTextureData} from '../../../_utils/data';
import {withCheckLicense} from '../../license';
import {DEFAULT_LINE_COLOR, DEFAULT_TEXT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../../props';
import {getContourLines} from './contour-line';
import {getContourLabels} from './contour-label';

const defaultProps = {
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  delta: {type: 'number', value: null, required: true},
  color: {type: 'color', value: DEFAULT_LINE_COLOR},
  width: {type: 'number', value: 1},
  textFunction: {type: 'function', value: DEFAULT_TEXT_FUNCTION},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

@withCheckLicense
class ContourLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {color, width, textFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor} = this.props;
    const {contourLines, visibleContourLabels} = this.state;

    if (!contourLines) {
      return [];
    }

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

    if (image !== oldProps.image || delta !== oldProps.delta) {
      this.updateContourLines();
    }

    if (changeFlags.viewportChanged) {
      this.updateVisibleContourLabels();
    }
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

    this.updateContourLabelIndex();
  }

  updateContourLabelIndex() {
    const {contourLabels} = this.state;

    const contourLabelIndex = new Supercluster({
      radius: 40,
      maxZoom: 16
    });
    contourLabelIndex.load(contourLabels);

    this.setState({ contourLabelIndex });

    this.updateVisibleContourLabels();
  }

  updateVisibleContourLabels() {
    const {viewport} = this.context;
    const {contourLabelIndex} = this.state;
    if (!contourLabelIndex) {
      return;
    }

    // viewport
    const viewportGlobeCenter = getViewportGlobeCenter(viewport);
    const viewportGlobeRadius = getViewportGlobeRadius(viewport);
    const viewportBounds = getViewportBounds(viewport);
    const zoom = Math.floor(getViewportZoom(viewport));
    let visibleContourLabels;
    // TODO: filter instead of clustering in supercluster
    if (isViewportGlobe(viewport)) {
      // TODO: fix cluster density near the poles, use geokdbush in supercluster
      visibleContourLabels = contourLabelIndex.getClusters([-180, -90, 180, 90], zoom).filter(x => !x.properties.cluster);
      const kdbushIndex = new KDBush(visibleContourLabels, x => x.geometry.coordinates[0], x => x.geometry.coordinates[1], undefined, Float32Array);
      visibleContourLabels = geokdbush.around(kdbushIndex, viewportGlobeCenter[0], viewportGlobeCenter[1], undefined, viewportGlobeRadius / 1000);
    } else {
      visibleContourLabels = contourLabelIndex.getClusters(viewportBounds, zoom).filter(x => !x.properties.cluster);
    }

    this.setState({ visibleContourLabels });
  }
}

ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;

export {ContourLayer};