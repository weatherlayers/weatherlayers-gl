import { CompositeLayer } from '@deck.gl/core/typed';
import type { Position, Color, LayerProps, DefaultProps, UpdateParameters, CompositeLayerProps, LayersList } from '@deck.gl/core/typed';
import { TextLayer, IconLayer, BitmapBoundingBox } from '@deck.gl/layers/typed';
import type { TextLayerProps, IconLayerProps } from '@deck.gl/layers/typed';
import { DEFAULT_TEXT_FORMAT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR, DEFAULT_ICON_SIZE, DEFAULT_ICON_COLOR, ensureDefaultProps } from '../../../_utils/props.js';
import type { TextFormatFunction } from '../../../_utils/props.js';
import type { TextureData } from '../../../_utils/data.js';
import { ImageInterpolation } from '../../../_utils/image-interpolation.js';
import { ImageType } from '../../../_utils/image-type.js';
import type { ImageUnscale } from '../../../_utils/image-unscale.js';
import type { UnitFormat } from '../../../_utils/unit-format.js';
import { getViewportAngle } from '../../../_utils/viewport.js';
import { getViewportGridPositions } from '../../../_utils/viewport-grid.js';
import { GridStyle, GRID_ICON_STYLES } from './grid-style.js';
import { getRasterPoints } from '../../../_utils/raster-data.js';
import type { RasterPointProperties } from '../../../_utils/raster-data.js';

type _GridCompositeLayerProps = CompositeLayerProps & {
  image: TextureData | null;
  image2: TextureData | null;
  imageSmoothing: number;
  imageInterpolation: ImageInterpolation;
  imageWeight: number;
  imageType: ImageType;
  imageUnscale: ImageUnscale;
  bounds: BitmapBoundingBox;

  style: GridStyle;
  unitFormat: UnitFormat | null;
  textFormatFunction: TextFormatFunction;
  textFontFamily: string;
  textSize: number;
  textColor: Color;
  textOutlineWidth: number;
  textOutlineColor: Color;
  iconBounds: [number, number] | null;
  iconSize: number;
  iconColor: Color;
}

export type GridCompositeLayerProps = _GridCompositeLayerProps & LayerProps;

const defaultProps: DefaultProps<GridCompositeLayerProps> = {
  image: { type: 'object', value: null }, // object instead of image to allow reading raw data
  image2: { type: 'object', value: null }, // object instead of image to allow reading raw data
  imageSmoothing: { type: 'number', value: 0 },
  imageInterpolation: { type: 'object', value: ImageInterpolation.CUBIC },
  imageWeight: { type: 'number', value: 0 },
  imageType: { type: 'object', value: ImageType.SCALAR },
  imageUnscale: { type: 'array', value: null },
  bounds: { type: 'array', value: [-180, -90, 180, 90], compare: true },

  style: { type: 'object', value: GridStyle.VALUE },
  unitFormat: { type: 'object', value: null },
  textFormatFunction: { type: 'function', value: DEFAULT_TEXT_FORMAT_FUNCTION },
  textFontFamily: { type: 'object', value: DEFAULT_TEXT_FONT_FAMILY },
  textSize: { type: 'number', value: DEFAULT_TEXT_SIZE },
  textColor: { type: 'color', value: DEFAULT_TEXT_COLOR },
  textOutlineWidth: { type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH },
  textOutlineColor: { type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR },
  iconBounds: { type: 'array', value: null },
  iconSize: { type: 'number', value: DEFAULT_ICON_SIZE },
  iconColor: { type: 'color', value: DEFAULT_ICON_COLOR },
};

// see https://observablehq.com/@cguastini/signed-distance-fields-wind-barbs-and-webgl
export class GridCompositeLayer<ExtraPropsT extends {} = {}> extends CompositeLayer<ExtraPropsT & Required<_GridCompositeLayerProps>> {
  static layerName = 'GridCompositeLayer';
  static defaultProps = defaultProps;

  renderLayers(): LayersList {
    const { viewport } = this.context;
    const { props, rasterPoints } = this.state;
    if (!props || !rasterPoints) {
      return [];
    }

    const { style, unitFormat, textFormatFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor, iconSize, iconColor } = ensureDefaultProps(props, defaultProps);
    const iconStyle = GRID_ICON_STYLES.get(style);

    if (iconStyle) {
      const { iconAtlas, iconMapping } = iconStyle;
      const iconBounds = iconStyle.iconBounds || props.iconBounds;
      const delta = (iconBounds[1] - iconBounds[0]) / Object.values(iconMapping).length;
      return [
        new IconLayer(this.getSubLayerProps({
          id: 'icon',
          data: rasterPoints,
          getPosition: d => d.geometry.coordinates as Position,
          getIcon: d => `${Math.min(Math.max(Math.floor((d.properties.value - iconBounds[0]) / delta), 0), Object.values(iconMapping).length - 1)}`,
          getSize: iconSize,
          getColor: iconColor,
          getAngle: d => getViewportAngle(viewport, d.properties.direction ? 360 - d.properties.direction : 0),
          iconAtlas,
          iconMapping,
          billboard: false,
        } satisfies IconLayerProps<GeoJSON.Feature<GeoJSON.Point, RasterPointProperties>>)),
      ];
    } else {
      return [
        new TextLayer(this.getSubLayerProps({
          id: 'text',
          data: rasterPoints,
          getPosition: d => d.geometry.coordinates as Position,
          getText: d => textFormatFunction(d.properties.value, unitFormat),
          getSize: textSize,
          getColor: textColor,
          getAngle: getViewportAngle(viewport, 0),
          outlineWidth: textOutlineWidth,
          outlineColor: textOutlineColor,
          fontFamily: textFontFamily,
          fontSettings: { sdf: true },
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
    const { image, image2, imageSmoothing, imageInterpolation, imageWeight } = params.props;

    super.updateState(params);

    if (
      image !== params.oldProps.image ||
      image2 !== params.oldProps.image2 ||
      imageSmoothing !== params.oldProps.imageSmoothing ||
      imageInterpolation !== params.oldProps.imageInterpolation ||
      imageWeight !== params.oldProps.imageWeight
    ) {
      this.#updateGridPoints();
    }

    if (params.changeFlags.viewportChanged) {
      this.#updatePositions();
    }

    this.setState({ props: params.props });
  }

  #updatePositions(): void {
    const { viewport } = this.context;

    const positions = getViewportGridPositions(viewport, 3);

    this.setState({ positions });

    this.#updateGridPoints();
  }

  #updateGridPoints(): void {
    const { image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, bounds } = ensureDefaultProps(this.props, defaultProps);
    const { positions } = this.state;
    if (!image) {
      return;
    }

    const rasterPoints = getRasterPoints(image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, bounds as GeoJSON.BBox, positions).features.filter(d => !isNaN(d.properties.value));

    this.setState({ rasterPoints });
  }
}