import type {Position} from '@deck.gl/core/typed';
import {distance as measureDistance, destinationPoint, initialBearing} from '../../../_utils/geodesy.js';

const ICON_MIN_DISTANCE = 5000;
const ICON_FACTOR = 3;

export interface TemporaryFrontIcon {
  distance: number;
  position: Position;
  direction: number;
  priority: number;
}

export interface FrontIcon<DataT> {
  d: DataT;
  primary: boolean;
  distance: number;
  position: Position;
  direction: number;
  priority: number;
}

// see https://github.com/visgl/deck.gl/blob/master/examples/website/collision-filter/calculateLabels.js
export function getFrontIcons<DataT>(d: DataT, path: Position[]): FrontIcon<DataT>[] {
  const positions = path as GeoJSON.Position[];
  const distances = positions.slice(0, -1).map((_, i) => measureDistance(positions[i], positions[i + 1]));
  const cummulativeDistances = distances.reduce((prev, curr, i) => [...prev, [i + 1, prev[prev.length - 1][1] + curr]], [[0, 0]]).reverse();
  const totalDistance = distances.reduce((prev, curr) => prev + curr, 0);

  // add icons to minimize overlaps, alternate icon type
  // depth = 1 -> |                 0                 1                 |
  // depth = 2 -> |     0     1     0     1     0     1     0     1     |
  // depth = 3 -> | 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 |
  let icons: TemporaryFrontIcon[] = [];
  for (let depth = 1, deltaDistance = totalDistance / ICON_FACTOR; deltaDistance > ICON_MIN_DISTANCE; depth++, deltaDistance /= ICON_FACTOR) {
    const iconCountAtDepth = ICON_FACTOR ** depth;
    for (let i = 1; i < iconCountAtDepth; i++) {
      // skip already added icons
      if (i % ICON_FACTOR === 0) {
        continue;
      }

      const distance = i * deltaDistance;
      const [j, cummulativeDistance] = cummulativeDistances.find(([_, cummulativeDistance]) => distance >= cummulativeDistance)!;
      const currentPosition = positions[j];
      const nextPosition = positions[j + 1];
  
      const bearing = initialBearing(currentPosition, nextPosition);
      const position = destinationPoint(currentPosition, distance - cummulativeDistance, bearing) as Position;
      const direction = 90 - bearing;
      const priority = 100 - depth; // top levels have highest priority
  
      icons.push({ distance, position, direction, priority });
    }
  }
  icons = icons.sort((a, b) => a.distance - b.distance);

  const alternatingIcons = icons.map((icon, i) => ({ d, primary: i % 2 === 0, ...icon })) satisfies FrontIcon<DataT>[];
  return alternatingIcons;
}