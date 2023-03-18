import {CompositeLayer} from '@deck.gl/core/typed';
import type {Position, Color, DefaultProps, CompositeLayerProps, LayerExtension} from '@deck.gl/core/typed';
import {PathLayer, IconLayer} from '@deck.gl/layers/typed';
import type {PathLayerProps, IconLayerProps} from '@deck.gl/layers/typed';
import {CollisionFilterExtension, PathStyleExtension} from '@deck.gl/extensions/typed';
import type {CollisionFilterExtensionProps, PathStyleExtensionProps} from '@deck.gl/extensions/typed';
import {distance, destinationPoint, initialBearing} from '../../../_utils/geodesy.js';
import {getViewportAngle} from '../../../_utils/viewport.js';
import {FrontType, iconAtlas, iconMapping} from './front-type.js';

const DEFAULT_WIDTH = 2;
const DEFAULT_COLD_COLOR: Color = [0, 0, 255];
const DEFAULT_WARM_COLOR: Color = [255, 0, 0];
const DEFAULT_OCCLUDED_COLOR: Color = [148, 0, 211];
const DEFAULT_ICON_SIZE = 20;

const ICON_DISTANCE = 10000;

interface FrontIcon<DataT> {
  d: DataT;
  position: Position;
  direction: number;
  priority: number;
}

export type FrontCompositeLayerProps<DataT> = CompositeLayerProps & {
  data: DataT[];

  getType: ((d: DataT) => FrontType) | null;
  getPath: ((d: DataT) => Position[]) | null;
  width: number;
  coldColor: Color;
  warmColor: Color;
  occludedColor: Color;
  iconSize: number;
}

const defaultProps = {
  data: {type: 'array', value: []},

  getType: {type: 'function', value: null},
  getPath: {type: 'function', value: null},
  width: {type: 'number', value: DEFAULT_WIDTH},
  coldColor: {type: 'color', value: DEFAULT_COLD_COLOR},
  warmColor: {type: 'color', value: DEFAULT_WARM_COLOR},
  occludedColor: {type: 'color', value: DEFAULT_OCCLUDED_COLOR},
  iconSize: {type: 'number', value: DEFAULT_ICON_SIZE},
} satisfies DefaultProps<FrontCompositeLayerProps<any>>;

export class FrontCompositeLayer<DataT = any> extends CompositeLayer<FrontCompositeLayerProps<DataT>> {
  renderLayers() {
    const {viewport} = this.context;
    const {data, getType, getPath, width, coldColor, warmColor, occludedColor, iconSize} = this.props;
    if (!data || !getType || !getPath) {
      return [];
    }

    const frontIcons = data.flatMap(d => {
      const path = getPath(d);

      const distances = path.slice(0, -1).map((_, i) => distance(path[i] as GeoJSON.Position, path[i + 1] as GeoJSON.Position));
      const cummulativeDistances = distances.reduce((prev, curr, i) => [...prev, [i + 1, prev[prev.length - 1][1] + curr]], [[0, 0]]).reverse();
      const totalDistance = distances.reduce((prev, curr) => prev + curr, 0);
      const iconCount = Math.ceil(totalDistance / ICON_DISTANCE - 1);
      
      return new Array(iconCount).fill(undefined).map((_, i) => {
        const dist = ICON_DISTANCE * (i + 0.5);
        const [j, cummulativeDistance] = cummulativeDistances.find(([_, cummulativeDistance]) => dist >= cummulativeDistance)!;
        const currentPosition = path[j];
        const nextPosition = path[j + 1];

        // TODO: drop imprecise icon positions in high zoom
        const bearing = initialBearing(currentPosition as GeoJSON.Position, nextPosition as GeoJSON.Position);
        const position = destinationPoint(currentPosition as GeoJSON.Position, dist - cummulativeDistance, bearing) as Position;
        const direction = 90 - bearing;
        // const priority = 0;
        const priority = (
          iconCount >= 729 ? 0 :
          iconCount >= 243 ? 1 :
          iconCount >= 81 ? 2 :
          iconCount >= 27 ? 3 :
          iconCount >= 9 ? 4 :
          iconCount >= 3 ? 5 :
          6
        ) + (
          i % 729 === 364 ? 6 :
          i % 243 === 121 ? 5 :
          i % 81 === 40 ? 4 :
          i % 27 === 13 ? 3 :
          i % 9 === 4 ? 2 :
          i % 3 === 1 ? 1 :
          0
        );
  
        return { d, position, direction, priority };
      });
    }) satisfies FrontIcon<DataT>[];

    const FrontTypeToColor = {
      [FrontType.COLD]: coldColor,
      [FrontType.WARM]: warmColor,
      [FrontType.OCCLUDED]: occludedColor,
      [FrontType.STATIONARY]: coldColor,
    } satisfies {[key in FrontType]: Color};

    return [
      new PathLayer(this.getSubLayerProps({
        id: 'path',
        data,
        getPath,
        getColor: d => FrontTypeToColor[getType(d)],
        getWidth: width,
        widthUnits: 'pixels',
      } satisfies PathLayerProps<DataT>)),

      new PathLayer(this.getSubLayerProps({
        id: 'path-stationary-warm',
        data: data.filter(d => getType(d) === FrontType.STATIONARY),
        getPath,
        getColor: warmColor,
        getWidth: width,
        widthUnits: 'pixels',

        extensions: [new PathStyleExtension({ dash: true, highPrecisionDash: true })] as LayerExtension<any>[],
        getDashArray: [DEFAULT_ICON_SIZE * 3, DEFAULT_ICON_SIZE * 3],
      } satisfies PathLayerProps<DataT> & PathStyleExtensionProps<DataT>)),

      new IconLayer(this.getSubLayerProps({
        id: 'icon',
        data: frontIcons.filter(d => getType(d.d) !== FrontType.STATIONARY),
        getPosition: d => d.position,
        getIcon: d => getType(d.d),
        getSize: iconSize,
        getColor: d => FrontTypeToColor[getType(d.d)],
        getAngle: d => getViewportAngle(viewport, d.direction),
        iconAtlas,
        iconMapping,
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionEnabled: true,
        collisionGroup: 'icon',
        collisionTestProps: { sizeScale: 10 },
        getCollisionPriority: (d: FrontIcon<DataT>) => d.priority,
      } satisfies IconLayerProps<FrontIcon<DataT>> & CollisionFilterExtensionProps<FrontIcon<DataT>>)),

      new IconLayer(this.getSubLayerProps({
        id: 'icon-stationary-cold',
        data: frontIcons.filter((d, i) => getType(d.d) === FrontType.STATIONARY && i % 2 === 0),
        getPosition: d => d.position,
        getIcon: () => FrontType.COLD,
        getSize: iconSize,
        getColor: coldColor,
        getAngle: d => getViewportAngle(viewport, d.direction),
        iconAtlas,
        iconMapping,
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionEnabled: true,
        collisionGroup: 'icon',
        collisionTestProps: { sizeScale: 10 },
        getCollisionPriority: (d: FrontIcon<DataT>) => d.priority,
      } satisfies IconLayerProps<FrontIcon<DataT>> & CollisionFilterExtensionProps<FrontIcon<DataT>>)),

      new IconLayer(this.getSubLayerProps({
        id: 'icon-stationary-warm',
        data: frontIcons.filter((d, i) => getType(d.d) === FrontType.STATIONARY && i % 2 === 1),
        getPosition: d => d.position,
        getIcon: () => FrontType.WARM,
        getSize: iconSize,
        getColor: warmColor,
        getAngle: d => getViewportAngle(viewport, d.direction + 180),
        iconAtlas,
        iconMapping,
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionEnabled: true,
        collisionGroup: 'icon',
        collisionTestProps: { sizeScale: 10 },
        getCollisionPriority: (d: FrontIcon<DataT>) => d.priority,
      } satisfies IconLayerProps<FrontIcon<DataT>> & CollisionFilterExtensionProps<FrontIcon<DataT>>)),
    ];
  }
}

FrontCompositeLayer.layerName = 'FrontCompositeLayer';
FrontCompositeLayer.defaultProps = defaultProps;