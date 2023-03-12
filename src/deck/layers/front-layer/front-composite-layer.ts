import {CompositeLayer} from '@deck.gl/core/typed';
import type {Position, DefaultProps, CompositeLayerProps, LayerExtension} from '@deck.gl/core/typed';
import {PathLayer, IconLayer} from '@deck.gl/layers/typed';
import type {PathLayerProps, IconLayerProps} from '@deck.gl/layers/typed';
import {CollisionFilterExtension, PathStyleExtension} from '@deck.gl/extensions/typed';
import type {CollisionFilterExtensionProps, PathStyleExtensionProps} from '@deck.gl/extensions/typed';
import {initialBearing} from '../../../_utils/geodesy';
import {FrontType, FrontTypeToColor, FrontTypeToAlternateColor, iconAtlas, iconMapping} from './front-type.js';

const DEFAULT_FRONT_ICON_SIZE = 30;
const FRONT_ICON_COUNT = 9;

interface FrontIcon<DataT> {
  d: DataT;
  point: Position;
  direction: number;
  priority: number;
}

export type FrontCompositeLayerProps<DataT> = CompositeLayerProps & {
  data: DataT[];

  getPath: ((d: DataT) => Position[]) | null;
  getFrontType: ((d: DataT) => FrontType) | null;
  iconSize: number;
}

const defaultProps = {
  data: {type: 'array', value: []},

  getPath: {type: 'function', value: null},
  getFrontType: {type: 'function', value: null},
  iconSize: {type: 'number', value: DEFAULT_FRONT_ICON_SIZE},
} satisfies DefaultProps<FrontCompositeLayerProps<any>>;

export class FrontCompositeLayer<DataT = any> extends CompositeLayer<FrontCompositeLayerProps<DataT>> {
  renderLayers() {
    const {data, getPath, getFrontType, iconSize} = this.props;
    if (!data || !getPath || !getFrontType) {
      return [];
    }

    const frontIcons = data.map(d => {
      const path = getPath(d);

      return new Array((path.length - 1) * FRONT_ICON_COUNT).fill(undefined).map((_, i) => {
        const j = Math.floor(i / FRONT_ICON_COUNT);
        const k = i % FRONT_ICON_COUNT;
        const currentPoint = path[j] as unknown as GeoJSON.Position;
        const nextPoint = path[j + 1] as unknown as GeoJSON.Position;
        const diffPoint = [nextPoint[0] - currentPoint[0], nextPoint[1] - currentPoint[1]];
        const point = [currentPoint[0] + diffPoint[0] / FRONT_ICON_COUNT * (k + 0.5), currentPoint[1] + diffPoint[1] / FRONT_ICON_COUNT * (k + 0.5)] satisfies Position;
        const direction = 90 - initialBearing(currentPoint, nextPoint);
        const priority = k % 9 === 4 ? 2 : k % 3 === 1 ? 1 : 0; // TODO: generalize
  
        return { d, point, direction, priority };
      });
    }).flat() satisfies FrontIcon<DataT>[];

    return [
      new PathLayer(this.getSubLayerProps({
        id: 'path',
        data,
        getPath,
        getColor: d => FrontTypeToColor[getFrontType(d)],
        getWidth: 2,
        widthUnits: 'pixels',
      } satisfies PathLayerProps<DataT>)),
      new PathLayer(this.getSubLayerProps({
        id: 'path-alternate',
        data: data.filter(d => FrontTypeToAlternateColor[getFrontType(d)]),
        getPath,
        getColor: d => FrontTypeToAlternateColor[getFrontType(d)]!,
        getWidth: 2,
        widthUnits: 'pixels',

        extensions: [new PathStyleExtension({dash: true, highPrecisionDash: true})] as LayerExtension<any>[],
        getDashArray: [DEFAULT_FRONT_ICON_SIZE, DEFAULT_FRONT_ICON_SIZE],
      } satisfies PathLayerProps<DataT> & PathStyleExtensionProps<DataT>)),
      new IconLayer(this.getSubLayerProps({
        id: 'icon',
        data: frontIcons,
        getPosition: d => d.point,
        getIcon: d => Object.values(FrontType).indexOf(getFrontType(d.d)) as unknown as string,
        getSize: iconSize,
        getColor: d => FrontTypeToColor[getFrontType(d.d)],
        getAngle: d => d.direction,
        iconAtlas,
        iconMapping,
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionEnabled: true,
        collisionTestProps: {sizeScale: 3},
        getCollisionPriority: (d: FrontIcon<DataT>) => d.priority,
      } satisfies IconLayerProps<FrontIcon<DataT>> & CollisionFilterExtensionProps<FrontIcon<DataT>>)),
    ];
  }
}

FrontCompositeLayer.layerName = 'FrontCompositeLayer';
FrontCompositeLayer.defaultProps = defaultProps;