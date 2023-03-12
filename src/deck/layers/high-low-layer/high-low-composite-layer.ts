import {CompositeLayer} from '@deck.gl/core/typed';
import type {Position, Color, DefaultProps, CompositeLayerProps, UpdateParameters} from '@deck.gl/core/typed';
import {TextLayer, BitmapBoundingBox} from '@deck.gl/layers/typed';
import type {TextLayerProps} from '@deck.gl/layers/typed';
import {CollisionFilterExtension} from '@deck.gl/extensions/typed';
import type {CollisionFilterExtensionProps} from '@deck.gl/extensions/typed';
import {DEFAULT_TEXT_FORMAT_FUNCTION, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../../../_utils/props.js';
import type {TextFormatFunction} from '../../../_utils/props.js';
import type {TextureData} from '../../../_utils/data.js';
import {ImageType} from '../../../_utils/image-type.js';
import type {ImageUnscale} from '../../../_utils/image-unscale.js';
import type {UnitFormat} from '../../../_utils/unit-format.js';
import {getViewportPixelOffset, getViewportAngle} from '../../../_utils/viewport.js';
import {getHighLowPoints} from '../../../standalone/providers/high-low-provider/high-low-point.js';
import type {HighLowPointProperties} from '../../../standalone/providers/high-low-provider/high-low-point.js';

function getHighLowPointCollisionPriority(highLowPoint: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>, minValue: number, maxValue: number): number {
  if (highLowPoint.properties.type === 'H') {
    return Math.round((highLowPoint.properties.value - maxValue) / maxValue * 100);
  } else {
    return Math.round((minValue - highLowPoint.properties.value) / minValue * 100);
  }
}

export type HighLowCompositeLayerProps = CompositeLayerProps & {
  image: TextureData | null;
  imageType: ImageType;
  imageUnscale: ImageUnscale;
  bounds: BitmapBoundingBox;

  radius: number;

  unitFormat: UnitFormat | null;
  textFormatFunction: TextFormatFunction;
  textFontFamily: string;
  textSize: number;
  textColor: Color;
  textOutlineWidth: number;
  textOutlineColor: Color;
}

const defaultProps = {
  image: {type: 'object', value: null}, // object instead of image to allow reading raw data
  imageType: {type: 'object', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},

  radius: {type: 'number', value: 0},

  unitFormat: {type: 'object', value: null},
  textFormatFunction: {type: 'function', value: DEFAULT_TEXT_FORMAT_FUNCTION},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
} satisfies DefaultProps<HighLowCompositeLayerProps>;

class HighLowCompositeLayer extends CompositeLayer<HighLowCompositeLayerProps> {
  renderLayers() {
    const {viewport} = this.context;
    const {props, highLowPoints, minValue, maxValue} = this.state;
    if (!props || !highLowPoints) {
      return [];
    }

    const {unitFormat, textFormatFunction, textFontFamily, textSize, textColor, textOutlineWidth, textOutlineColor} = props;

    return [
      new TextLayer(this.getSubLayerProps({
        id: 'type',
        data: highLowPoints,
        getPixelOffset: [0, -getViewportPixelOffset(viewport, (textSize * 1.2) / 2)],
        getPosition: d => d.geometry.coordinates as Position,
        getText: d => d.properties.type,
        getSize: textSize * 1.2,
        getColor: textColor,
        getAngle: getViewportAngle(viewport, 0),
        outlineWidth: textOutlineWidth,
        outlineColor: textOutlineColor,
        fontFamily: textFontFamily,
        fontSettings: { sdf: true },
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionEnabled: true,
        collisionTestProps: {sizeScale: 5},
        getCollisionPriority: (d: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>) => getHighLowPointCollisionPriority(d, minValue, maxValue),
      } satisfies TextLayerProps<GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>> & CollisionFilterExtensionProps<GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>>)),
      new TextLayer(this.getSubLayerProps({
        id: 'value',
        data: highLowPoints,
        getPixelOffset: [0, getViewportPixelOffset(viewport, (textSize * 1.2) / 2)],
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
        
        extensions: [new CollisionFilterExtension()],
        collisionEnabled: true,
        collisionTestProps: {sizeScale: 5},
        getCollisionPriority: (d: GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>) => getHighLowPointCollisionPriority(d, minValue, maxValue),
      } satisfies TextLayerProps<GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>> & CollisionFilterExtensionProps<GeoJSON.Feature<GeoJSON.Point, HighLowPointProperties>>)),
    ];
  }

  shouldUpdateState(params: UpdateParameters<this>) {
    return super.shouldUpdateState(params) || params.changeFlags.viewportChanged;
  }

  updateState(params: UpdateParameters<this>) {
    const {image, radius} = params.props;

    super.updateState(params);

    if (!radius) {
      this.setState({
        highLowPoints: undefined,
        minValue: undefined,
        maxValue: undefined,
      });
      return;
    }

    if (image !== params.oldProps.image || radius !== params.oldProps.radius) {
      this.updateHighLowPoints();
    }

    this.setState({ props: params.props });
  }

  async updateHighLowPoints() {
    const {image, imageType, imageUnscale, bounds, radius} = this.props;
    if (!image) {
      return;
    }

    const highLowPoints = (await getHighLowPoints(image, imageType, imageUnscale, bounds as GeoJSON.BBox, radius)).features;
    const values = highLowPoints.map(highLowPoint => highLowPoint.properties.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    this.setState({ image, radius, highLowPoints, minValue, maxValue });
  }
}

HighLowCompositeLayer.layerName = 'HighLowCompositeLayer';
HighLowCompositeLayer.defaultProps = defaultProps;

export {HighLowCompositeLayer};