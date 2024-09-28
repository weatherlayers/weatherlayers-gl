import {CompositeLayer} from '@deck.gl/core';
import type {Position, Color, LayerProps, DefaultProps, UpdateParameters, CompositeLayerProps, LayersList} from '@deck.gl/core';
import {TextLayer, IconLayer} from '@deck.gl/layers';
import type {TextLayerProps, IconLayerProps, BitmapBoundingBox} from '@deck.gl/layers';
import type {Texture} from '@luma.gl/core';
import {DEFAULT_TEXT_FORMAT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR, DEFAULT_ICON_SIZE, DEFAULT_ICON_COLOR, ensureDefaultProps} from '../../_utils/props.js';
import type {TextFormatFunction} from '../../_utils/props.js';
import {loadTextureData} from '../../../client/_utils/texture-data.js';
import type {TextureData} from '../../../client/_utils/texture-data.js';
import {createTextureCached} from '../../_utils/texture.js';
import {ImageInterpolation} from '../../_utils/image-interpolation.js';
import {ImageType} from '../../../client/_utils/image-type.js';
import type {ImageUnscale} from '../../../client/_utils/image-unscale.js';
import type {UnitFormat} from '../../../client/_utils/unit-format.js';
import {isViewportInZoomBounds, getViewportAngle} from '../../_utils/viewport.js';
import {getViewportGridPositions} from '../../_utils/viewport-grid.js';
import {getRasterPoints} from '../../_utils/raster-data.js';
import type {RasterPointProperties} from '../../_utils/raster-data.js';
import {parsePalette, type Palette, type Scale} from '../../../client/_utils/palette.js';
import {paletteColorToGl} from '../../_utils/color.js';
import type {IconStyle} from '../../_utils/icon-style.js';
import {GridStyle, GRID_ICON_STYLES} from './grid-style.js';

type _GridCompositeLayerProps = CompositeLayerProps & {
  image: TextureData | null;
  image2: TextureData | null;
  imageSmoothing: number;
  imageInterpolation: ImageInterpolation;
  imageWeight: number;
  imageType: ImageType;
  imageUnscale: ImageUnscale;
  imageMinValue: number | null;
  imageMaxValue: number | null;
  bounds: BitmapBoundingBox;
  minZoom: number | null;
  maxZoom: number | null;

  style: GridStyle;
  density: number;
  unitFormat: UnitFormat | null;
  textFormatFunction: TextFormatFunction;
  textFontFamily: string;
  textSize: number;
  textColor: Color;
  textOutlineWidth: number;
  textOutlineColor: Color;
  iconBounds: [number, number] | null;
  iconSize: [number, number] | number;
  iconColor: Color;
  palette: Palette | null;
}

export type GridCompositeLayerProps = _GridCompositeLayerProps & LayerProps;

const defaultProps: DefaultProps<GridCompositeLayerProps> = {
  image: {type: 'object', value: null}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data
  imageSmoothing: {type: 'number', value: 0},
  imageInterpolation: {type: 'object', value: ImageInterpolation.CUBIC},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'object', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},
  imageMinValue: {type: 'object', value: null},
  imageMaxValue: {type: 'object', value: null},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
  minZoom: {type: 'object', value: null},
  maxZoom: {type: 'object', value: null},

  style: {type: 'object', value: GridStyle.VALUE},
  density: {type: 'number', value: 0},
  unitFormat: {type: 'object', value: null},
  textFormatFunction: {type: 'function', value: DEFAULT_TEXT_FORMAT_FUNCTION},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
  iconBounds: {type: 'array', value: null},
  iconSize: {type: 'object', value: DEFAULT_ICON_SIZE},
  iconColor: {type: 'color', value: DEFAULT_ICON_COLOR},
  palette: {type: 'object', value: null},
};

// see https://observablehq.com/@cguastini/signed-distance-fields-wind-barbs-and-webgl
export class GridCompositeLayer<ExtraPropsT extends {} = {}> extends CompositeLayer<ExtraPropsT & Required<_GridCompositeLayerProps>> {
  static layerName = 'GridCompositeLayer';
  static defaultProps = defaultProps;

  declare state: CompositeLayer['state'] & {
    props?: GridCompositeLayerProps;
    iconStyle?: IconStyle;
    iconAtlasTexture?: Texture;
    paletteScale?: Scale;
    positions?: GeoJSON.Position[];
    points?: GeoJSON.Feature<GeoJSON.Point, RasterPointProperties>[];
    visiblePositions?: GeoJSON.Position[];
    visiblePoints?: GeoJSON.Feature<GeoJSON.Point, RasterPointProperties>[];
  };

  renderLayers(): LayersList {
    const {viewport} = this.context;
    const {props, visiblePoints} = this.state;
    if (!props || !visiblePoints) {
      return [];
    }

    const {style, unitFormat, textFormatFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor, iconSize, iconColor} = ensureDefaultProps(props, defaultProps);
    const {paletteScale} = this.state;

    if (GRID_ICON_STYLES.has(style)) {
      const {iconStyle, iconAtlasTexture} = this.state;
      if (!iconStyle || !iconAtlasTexture) {
        return [];
      }

      const iconCount = Object.keys(iconStyle.iconMapping).length;
      const iconBounds = props.iconBounds ?? iconStyle.iconBounds ?? [0, 0];
      const iconBoundsDelta = iconBounds[1] - iconBounds[0];
      const iconBoundsRatio = (value: number) => (value - iconBounds[0]) / iconBoundsDelta;
      const iconSizeDelta = Array.isArray(iconSize) ? iconSize[1] - iconSize[0] : 0;
      return [
        new IconLayer(this.getSubLayerProps({
          id: 'icon',
          data: visiblePoints,
          getPosition: d => d.geometry.coordinates as Position,
          getIcon: d => `${Math.min(Math.max(Math.floor(iconBoundsRatio(d.properties.value) * iconCount), 0), iconCount - 1)}`,
          getSize: d => Array.isArray(iconSize) ? iconSize[0] + (iconBoundsRatio(d.properties.value) * iconSizeDelta) : iconSize,
          getColor: d => paletteScale ? paletteColorToGl(paletteScale(d.properties.value).rgba()) : iconColor,
          getAngle: d => getViewportAngle(viewport, d.properties.direction ? 360 - d.properties.direction : 0),
          iconAtlas: iconAtlasTexture,
          iconMapping: iconStyle.iconMapping,
          billboard: false,
        } satisfies IconLayerProps<GeoJSON.Feature<GeoJSON.Point, RasterPointProperties>>)),
      ];
    } else {
      return [
        new TextLayer(this.getSubLayerProps({
          id: 'text',
          data: visiblePoints,
          getPosition: d => d.geometry.coordinates as Position,
          getText: d => textFormatFunction(d.properties.value, unitFormat),
          getSize: textSize,
          getColor: d => paletteScale ? paletteColorToGl(paletteScale(d.properties.value).rgba()) : textColor,
          getAngle: getViewportAngle(viewport, 0),
          outlineWidth: textOutlineWidth,
          outlineColor: textOutlineColor,
          fontFamily: textFontFamily,
          fontSettings: {sdf: true},
          billboard: false,
        } satisfies TextLayerProps<GeoJSON.Feature<GeoJSON.Point, RasterPointProperties>>)),
      ];
    }
  }

  shouldUpdateState(params: UpdateParameters<this>): boolean {
    return super.shouldUpdateState(params) || params.changeFlags.viewportChanged;
  }

  initializeState(): void {
    this.#updatePositions();
  }

  updateState(params: UpdateParameters<this>): void {
    const {image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, minZoom, maxZoom, style, density, unitFormat, textFormatFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor, iconSize, iconColor, palette, visible} = params.props;

    super.updateState(params);

    if (!visible) {
      this.setState({
        points: undefined,
        visiblePoints: undefined,
      });
      return;
    }

    if (
      !this.state.iconStyle ||
      style !== params.oldProps.style
    ) {
      this.#updateIconStyle();
    }

    if (
      density !== params.oldProps.density ||
      params.changeFlags.viewportChanged
    ) {
      this.#updatePositions();
    }

    if (
      image !== params.oldProps.image ||
      image2 !== params.oldProps.image2 ||
      imageSmoothing !== params.oldProps.imageSmoothing ||
      imageInterpolation !== params.oldProps.imageInterpolation ||
      imageWeight !== params.oldProps.imageWeight ||
      imageType !== params.oldProps.imageType ||
      imageUnscale !== params.oldProps.imageUnscale ||
      imageMinValue !== params.oldProps.imageMinValue ||
      imageMaxValue !== params.oldProps.imageMaxValue ||
      visible !== params.oldProps.visible
    ) {
      this.#updateFeatures();
    }

    if (
      minZoom !== params.oldProps.minZoom ||
      maxZoom !== params.oldProps.maxZoom ||
      params.changeFlags.viewportChanged
    ) {
      this.#updateVisibleFeatures();
    }

    if (palette !== params.oldProps.palette) {
      this.#updatePalette();
    }

    if (
      unitFormat !== params.oldProps.unitFormat ||
      textFormatFunction !== params.oldProps.textFormatFunction ||
      textFontFamily !== params.oldProps.textFontFamily ||
      textSize !== params.oldProps.textSize ||
      textColor !== params.oldProps.textColor ||
      textOutlineWidth !== params.oldProps.textOutlineWidth ||
      textOutlineColor !== params.oldProps.textOutlineColor ||
      iconSize !== params.oldProps.iconSize ||
      iconColor !== params.oldProps.iconColor
    ) {
      this.#redrawVisibleFeatures();
    }

    this.setState({props: params.props});
  }

  async #updateIconStyle(): Promise<void> {
    const {device} = this.context;
    const {style} = ensureDefaultProps(this.props, defaultProps);

    const iconStyle = GRID_ICON_STYLES.get(style);
    if (!iconStyle) {
      this.setState({
        iconStyle: undefined,
        iconAtlasTexture: undefined,
      });
      return;
    }

    this.setState({iconStyle});

    const iconAtlasTexture = createTextureCached(device, await loadTextureData(iconStyle.iconAtlas));

    this.setState({iconAtlasTexture});
  }

  #updatePositions(): void {
    const {viewport} = this.context;
    const {density} = ensureDefaultProps(this.props, defaultProps);

    const positions = getViewportGridPositions(viewport, density + 3);

    this.setState({positions});

    this.#updateFeatures();
  }

  #updateFeatures(): void {
    const {image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, bounds} = ensureDefaultProps(this.props, defaultProps);
    const {positions} = this.state;
    if (!image || !positions) {
      return;
    }

    const imageProperties = {image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue};
    const points = getRasterPoints(imageProperties, bounds as GeoJSON.BBox, positions).features.filter(d => !isNaN(d.properties.value));

    this.setState({points});

    this.#updateVisibleFeatures();
  }

  #updateVisibleFeatures(): void {
    const {viewport} = this.context;
    const {minZoom, maxZoom} = ensureDefaultProps(this.props, defaultProps);
    const {points} = this.state;
    if (!points) {
      return;
    }

    let visiblePoints: GeoJSON.Feature<GeoJSON.Point, RasterPointProperties>[];
    if (isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      visiblePoints = points;
    } else {
      visiblePoints = [];
    }

    this.setState({visiblePoints});
  }

  #updatePalette(): void {
    const {palette} = ensureDefaultProps(this.props, defaultProps);
    if (!palette) {
      this.setState({paletteScale: undefined});

      this.#redrawVisibleFeatures();
      return;
    }

    const paletteScale = parsePalette(palette);

    this.setState({paletteScale});

    this.#redrawVisibleFeatures();
  }

  #redrawVisibleFeatures(): void {
    this.setState({visiblePoints: Array.isArray(this.state.visiblePoints) ? Array.from(this.state.visiblePoints) : this.state.visiblePoints});
  }
}