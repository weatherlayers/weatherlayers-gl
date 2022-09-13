import {CompositeLayer} from '@deck.gl/core';
import {TextLayer, IconLayer} from '@deck.gl/layers';
import {DEFAULT_TEXT_FORMAT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR, DEFAULT_ICON_SIZE, DEFAULT_ICON_COLOR} from '../../../_utils/props';
import {ImageType} from '../../../_utils/image-type';
import {getViewportAngle} from '../../../_utils/viewport';
import {getViewportGridPositions} from '../../../_utils/viewport-grid';
import {GridStyle} from '../../../_utils';
import {getGridPoints} from '../../../standalone/providers/grid-provider/grid-point';
import {GRID_ICON_STYLES} from './grid-style';

const defaultProps = {
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data
  imageInterpolate: {type: 'boolean', value: true},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},

  style: {type: 'object', value: GridStyle.VALUE},
  textFormatFunction: {type: 'function', value: DEFAULT_TEXT_FORMAT_FUNCTION},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
  iconBounds: {type: 'array', value: null},
  iconSize: {type: 'number', value: DEFAULT_ICON_SIZE},
  iconColor: {type: 'color', value: DEFAULT_ICON_COLOR},
};

// see https://observablehq.com/@cguastini/signed-distance-fields-wind-barbs-and-webgl
class GridCompositeLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {props, gridPoints} = this.state;

    if (!props || !gridPoints) {
      return [];
    }

    const {style, textFormatFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor, iconSize, iconColor} = props;
    const iconStyle = GRID_ICON_STYLES.get(style);

    if (iconStyle) {
      const {iconAtlas, iconMapping} = iconStyle;
      const iconBounds = iconStyle.iconBounds || props.iconBounds;
      const delta = (iconBounds[1] - iconBounds[0]) / iconMapping.length;
      return [
        new IconLayer(this.getSubLayerProps({
          id: 'icon',
          data: gridPoints,
          getPosition: d => d.geometry.coordinates,
          getIcon: d => Math.min(Math.max(Math.floor((d.properties.value - iconBounds[0]) / delta), 0), iconMapping.length - 1),
          getSize: iconSize,
          getColor: iconColor,
          getAngle: d => getViewportAngle(viewport, 360 - d.properties.direction),
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
  }

  shouldUpdateState({changeFlags}) {
    return super.shouldUpdateState({changeFlags}) || changeFlags.viewportChanged;
  }

  initializeState() {
    this.updatePositions();
  }

  updateState({props, oldProps, changeFlags}) {
    const {image, image2, imageInterpolate, imageWeight} = props;

    super.updateState({props, oldProps, changeFlags});

    if (image !== oldProps.image || image2 !== oldProps.image2 || imageInterpolate !== oldProps.imageInterpolate || imageWeight !== oldProps.imageWeight) {
      this.updateGridPoints();
    }

    if (changeFlags.viewportChanged) {
      this.updatePositions();
    }

    this.setState({ props });
  }

  updatePositions() {
    const {viewport} = this.context;

    const positions = getViewportGridPositions(viewport, 3);

    this.setState({ positions });

    this.updateGridPoints();
  }

  updateGridPoints() {
    const {image, image2, imageInterpolate, imageWeight, imageType, imageUnscale, bounds} = this.props;
    const {positions} = this.state;
    if (!image) {
      return;
    }

    const gridPoints = getGridPoints(image, image2, imageInterpolate, imageWeight, imageType, imageUnscale, bounds, positions).features;

    this.setState({ gridPoints });
  }
}

GridCompositeLayer.layerName = 'GridCompositeLayer';
GridCompositeLayer.defaultProps = defaultProps;

export {GridCompositeLayer};