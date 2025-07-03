import {CompositeLayer} from '@deck.gl/core';
import type {Position, Color, LayerProps, DefaultProps, CompositeLayerProps, UpdateParameters, LayersList} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import type {TextLayerProps, BitmapBoundingBox} from '@deck.gl/layers';
import {CollisionFilterExtension} from '@deck.gl/extensions';
import type {CollisionFilterExtensionProps} from '@deck.gl/extensions';
import {DEFAULT_TEXT_FORMAT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR, ensureDefaultProps} from '../../_utils/props.js';
import type {TextFormatFunction} from '../../_utils/props.js';
import type {TextureData} from '../../_utils/texture-data.js';
import {ImageInterpolation} from '../../_utils/image-interpolation.js';
import {ImageType} from '../../_utils/image-type.js';
import type {ImageUnscale} from '../../_utils/image-unscale.js';
import type {UnitFormat} from '../../_utils/unit-format.js';
import {randomString} from '../../_utils/random-string.js';
import {isViewportInZoomBounds, getViewportPixelOffset, getViewportAngle} from '../../_utils/viewport.js';
import {parsePalette, type Palette, type Scale} from '../../_utils/palette.js';
import {paletteColorToGl} from '../../_utils/color.js';
import {getHighLowPoints, HighLowType} from './high-low-point.js';
import type {HighLowPointProperties} from './high-low-point.js';

const HIGH_LOW_LABEL_COLLISION_GROUP = 'high-low-label';

function getHighLowPointCollisionPriority(highLowPoint: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>, minValue: number, maxValue: number): number {
  if (highLowPoint.properties.type === HighLowType.HIGH) {
    return Math.round((highLowPoint.properties.value - maxValue) / maxValue * 100);
  } else {
    return Math.round((minValue - highLowPoint.properties.value) / minValue * 100);
  }
}

type _HighLowCompositeLayerProps = CompositeLayerProps & {
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

  radius: number;

  unitFormat: UnitFormat | null;
  textFormatFunction: TextFormatFunction;
  textFontFamily: string;
  textSize: number;
  textColor: Color;
  textOutlineWidth: number;
  textOutlineColor: Color;
  palette: Palette | null;
}

export type HighLowCompositeLayerProps = _HighLowCompositeLayerProps & LayerProps;

const defaultProps: DefaultProps<HighLowCompositeLayerProps> = {
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

  radius: {type: 'number', value: 0},

  unitFormat: {type: 'object', value: null},
  textFormatFunction: {type: 'function', value: DEFAULT_TEXT_FORMAT_FUNCTION},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
  palette: {type: 'object', value: null},
};

export class HighLowCompositeLayer<ExtraPropsT extends {} = {}> extends CompositeLayer<ExtraPropsT & Required<_HighLowCompositeLayerProps>> {
  static layerName = 'HighLowCompositeLayer';
  static defaultProps = defaultProps;

  declare state: CompositeLayer['state'] & {
    props?: HighLowCompositeLayerProps;
    paletteScale?: Scale;
    positions?: GeoJSON.Position[];
    points?: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>[];
    visiblePositions?: GeoJSON.Position[];
    visiblePoints?: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>[];
    minValue?: number;
    maxValue?: number;
  };

  renderLayers(): LayersList {
    const {viewport} = this.context;
    const {props, visiblePoints, minValue, maxValue} = this.state;
    if (!props || !visiblePoints || typeof minValue !== 'number' || typeof maxValue !== 'number') {
      return [];
    }

    const {unitFormat, textFormatFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor} = ensureDefaultProps(props, defaultProps);
    const {paletteScale} = this.state;

    return [
      new TextLayer(this.getSubLayerProps({
        id: 'type',
        data: visiblePoints,
        getPixelOffset: [0, -getViewportPixelOffset(viewport, (textSize * 1.2) / 2)],
        getPosition: d => d.geometry.coordinates as Position,
        getText: d => d.properties.type,
        getSize: textSize * 1.2,
        getColor: d => paletteScale ? paletteColorToGl(paletteScale(d.properties.value).rgba()) : textColor,
        getAngle: getViewportAngle(viewport, 0),
        outlineWidth: textOutlineWidth,
        outlineColor: textOutlineColor,
        fontFamily: textFontFamily,
        fontSettings: {sdf: true},
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionEnabled: true,
        collisionGroup: HIGH_LOW_LABEL_COLLISION_GROUP,
        collisionTestProps: {sizeScale: 5},
        getCollisionPriority: (d: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>) => getHighLowPointCollisionPriority(d, minValue, maxValue),
        parameters: {
          cullMode: 'front', // enable culling to avoid rendering on both sides of the globe; front-face culling because it seems deck.gl uses a wrong winding order and setting frontFace: 'cw' throws "GL_INVALID_ENUM: Enum 0x0000 is currently not supported."
          depthCompare: 'always', // disable depth test to avoid conflict with Maplibre globe depth buffer, see https://github.com/visgl/deck.gl/issues/9357
          ...this.props.parameters,
        },
      } satisfies TextLayerProps<GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>> & CollisionFilterExtensionProps<GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>>)),
      new TextLayer(this.getSubLayerProps({
        id: 'value',
        data: visiblePoints,
        getPixelOffset: [0, getViewportPixelOffset(viewport, (textSize * 1.2) / 2)],
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
        
        extensions: [new CollisionFilterExtension()],
        collisionEnabled: true,
        collisionGroup: HIGH_LOW_LABEL_COLLISION_GROUP,
        collisionTestProps: {sizeScale: 5},
        getCollisionPriority: (d: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>) => getHighLowPointCollisionPriority(d, minValue, maxValue),
        parameters: {
          cullMode: 'front', // enable culling to avoid rendering on both sides of the globe; front-face culling because it seems deck.gl uses a wrong winding order and setting frontFace: 'cw' throws "GL_INVALID_ENUM: Enum 0x0000 is currently not supported."
          depthCompare: 'always', // disable depth test to avoid conflict with Maplibre globe depth buffer, see https://github.com/visgl/deck.gl/issues/9357
          ...this.props.parameters,
        },
      } satisfies TextLayerProps<GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>> & CollisionFilterExtensionProps<GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>>)),
    ];
  }

  shouldUpdateState(params: UpdateParameters<this>): boolean {
    return super.shouldUpdateState(params) || params.changeFlags.viewportChanged;
  }

  updateState(params: UpdateParameters<this>): void {
    const {image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, minZoom, maxZoom, radius, unitFormat, textFormatFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor, palette, visible} = params.props;

    super.updateState(params);

    if (!radius || !visible) {
      this.setState({
        points: undefined,
        visiblePoints: undefined,
        minValue: undefined,
        maxValue: undefined,
      });
      return;
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
      radius !== params.oldProps.radius ||
      visible !== params.oldProps.visible
    ) {
      this._updateFeatures();
    }

    if (
      minZoom !== params.oldProps.minZoom ||
      maxZoom !== params.oldProps.maxZoom ||
      params.changeFlags.viewportChanged
    ) {
      this._updateVisibleFeatures();
    }

    if (palette !== params.oldProps.palette) {
      this._updatePalette();
    }

    if (
      unitFormat !== params.oldProps.unitFormat ||
      textFormatFunction !== params.oldProps.textFormatFunction ||
      textFontFamily !== params.oldProps.textFontFamily ||
      textSize !== params.oldProps.textSize ||
      textColor !== params.oldProps.textColor ||
      textOutlineWidth !== params.oldProps.textOutlineWidth ||
      textOutlineColor !== params.oldProps.textOutlineColor
    ) {
      this._redrawVisibleFeatures();
    }

    this.setState({props: params.props});
  }

  private async _updateFeatures(): Promise<void> {
    const {image, image2, imageSmoothing, imageInterpolation, imageType, imageUnscale, imageMinValue, imageMaxValue, imageWeight, bounds, radius} = ensureDefaultProps(this.props, defaultProps);
    if (!image) {
      return;
    }

    const requestId = randomString();
    this.state.requestId = requestId;

    const imageProperties = {image, image2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue};
    const points = (await getHighLowPoints(imageProperties, bounds as GeoJSON.BBox, radius)).features;

    // discard displaying obsolete points
    if (this.state.requestId !== requestId) {
      return;
    }

    const values = points.map(highLowPoint => highLowPoint.properties.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    this.setState({points, minValue, maxValue});

    this._updateVisibleFeatures();
  }

  private _updateVisibleFeatures(): void {
    const {viewport} = this.context;
    const {minZoom, maxZoom} = ensureDefaultProps(this.props, defaultProps);
    const {points} = this.state;
    if (!points) {
      return;
    }

    let visiblePoints: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>[];
    if (isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      visiblePoints = points;
    } else {
      visiblePoints = [];
    }

    this.setState({visiblePoints});
  }

  private _updatePalette(): void {
    const {palette} = ensureDefaultProps(this.props, defaultProps);
    if (!palette) {
      this.setState({paletteScale: undefined});

      this._redrawVisibleFeatures();
      return;
    }

    const paletteScale = parsePalette(palette);

    this.setState({paletteScale});

    this._redrawVisibleFeatures();
  }

  private _redrawVisibleFeatures(): void {
    this.setState({visiblePoints: Array.isArray(this.state.visiblePoints) ? Array.from(this.state.visiblePoints) : this.state.visiblePoints});
  }
}