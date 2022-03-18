import {CompositeLayer} from '@deck.gl/core';
import {TextLayer, IconLayer} from '@deck.gl/layers';
import {ImageType} from '../../../_utils/image-type';
import {isViewportGlobe, getViewportGlobeCenter, getViewportGlobeRadius, getViewportBounds, getViewportZoom, getViewportAngle} from '../../../_utils/viewport';
import {generateGlobeGrid, generateGrid} from '../../../_utils/grid';
import {unscaleTextureData} from '../../../_utils/data';
import {withCheckLicense} from '../../license';
import {DEFAULT_TEXT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR, DEFAULT_ICON_SIZE, DEFAULT_ICON_COLOR} from '../../props';
import {GridStyle, GRID_ICON_STYLES} from './grid-style';
import {getGridPoints} from './grid-point';

const defaultProps = {
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  style: {type: 'object', value: GridStyle.VALUE},
  textFunction: {type: 'function', value: DEFAULT_TEXT_FUNCTION},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
  iconBounds: {type: 'array', value: null},
  iconSize: {type: 'number', value: DEFAULT_ICON_SIZE},
  iconColor: {type: 'color', value: DEFAULT_ICON_COLOR},

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

// see https://observablehq.com/@cguastini/signed-distance-fields-wind-barbs-and-webgl
@withCheckLicense
class GridLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {style, textFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor, iconBounds, iconSize, iconColor} = this.props;
    const {gridPoints} = this.state;

    if (!gridPoints) {
      return [];
    }

    const {iconAtlas, iconMapping} = GRID_ICON_STYLES.get(style) || {};
    const iconStyle = !!(iconBounds && iconAtlas && iconMapping);

    if (iconStyle) {
      const delta = (iconBounds[1] - iconBounds[0]) / iconMapping.length;
      return [
        new IconLayer(this.getSubLayerProps({
          id: 'icon',
          data: gridPoints,
          getPosition: d => d.geometry.coordinates,
          getIcon: d => Math.min(Math.max(Math.floor((d.properties.value - iconBounds[0]) / delta), 0), iconMapping.length - 1),
          getSize: iconSize,
          getColor: iconColor,
          getAngle: d => getViewportAngle(viewport, d.properties.direction + 90),
          iconAtlas,
          iconMapping,
          billboard: false,
        })),
      ];
    } else {
      return [
        new TextLayer(this.getSubLayerProps({
          id: 'text',
          data: gridPoints,
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
  }

  shouldUpdateState({changeFlags}) {
    return super.shouldUpdateState({changeFlags}) || changeFlags.viewportChanged;
  }

  initializeState() {
    this.updatePositions();
  }

  updateState({props, oldProps, changeFlags}) {
    const {image, image2, imageWeight, imageUnscale, type} = props;

    super.updateState({props, oldProps, changeFlags});

    if (imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    if (image !== oldProps.image || image2 !== oldProps.image2) {
      this.updateData();
    }

    if (imageWeight !== oldProps.imageWeight) {
      this.updateGridPoints();
    }

    if (type !== oldProps.type || changeFlags.viewportChanged) {
      this.updatePositions();
    }
  }

  updateData() {
    const {image, image2, imageUnscale} = this.props;
    if (!image) {
      return;
    }

    const unscaledData = unscaleTextureData(image, imageUnscale);
    const unscaledData2 = image2 ? unscaleTextureData(image2, imageUnscale) : null;

    this.setState({ unscaledData, unscaledData2 });

    this.updateGridPoints();
  }

  updatePositions() {
    const {viewport} = this.context;

    // viewport
    const viewportGlobeCenter = getViewportGlobeCenter(viewport);
    const viewportGlobeRadius = getViewportGlobeRadius(viewport);
    const viewportBounds = getViewportBounds(viewport);
    const zoom = Math.floor(getViewportZoom(viewport) + 3);
    const positions = isViewportGlobe(viewport) ? generateGlobeGrid(viewportGlobeCenter, viewportGlobeRadius, zoom) : generateGrid(viewportBounds, zoom);

    this.setState({ positions });

    this.updateGridPoints();
  }

  updateGridPoints() {
    const {imageWeight, imageType, bounds} = this.props;
    const {unscaledData, unscaledData2, positions} = this.state;
    if (!unscaledData) {
      return;
    }

    const gridPoints = getGridPoints(unscaledData, unscaledData2, imageWeight, imageType, positions, bounds);

    this.setState({ gridPoints });
  }
}

GridLayer.layerName = 'GridLayer';
GridLayer.defaultProps = defaultProps;

export {GridLayer};
export {GridStyle} from './grid-style';