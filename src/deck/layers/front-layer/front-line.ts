import type { Position } from '@deck.gl/core';
import { distance as measureDistance, destinationPoint, initialBearing } from '../../../_utils/geodesy.js';
import { findLastIndex } from '../../../_utils/array.js';

const ICON_MIN_DISTANCE = 5000;
const ICON_FACTOR = 3;

export interface TemporaryFrontIcon {
  distance: number;
  position: Position;
  direction: number;
  priority: number;
}

export interface FrontLine<DataT> {
  d: DataT;
  startPosition: Position;
  endPosition: Position;
  icons: FrontIcon<DataT>[];
}

export interface FrontIcon<DataT> {
  d: DataT;
  distance: number;
  position: Position;
  direction: number;
  priority: number;
  alternate: boolean;
}

// see https://github.com/visgl/deck.gl/blob/master/examples/website/collision-filter/calculateLabels.js
export function getFrontLine<DataT>(d: DataT, path: Position[]): FrontLine<DataT> {
  const positions = path as GeoJSON.Position[];
  const distances = positions.slice(0, -1).map((_, i) => measureDistance(positions[i], positions[i + 1]));
  const cummulativeDistances = distances.reduce((prev, curr) => [...prev, prev[prev.length - 1] + curr], [0]);
  const totalDistance = cummulativeDistances[cummulativeDistances.length - 1];

  // add icons to minimize overlaps, alternate icon type
  // depth = 1 -> |                 0                 1                 |
  // depth = 2 -> |     0     1     0     1     0     1     0     1     |
  // depth = 3 -> | 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 |
  let icons: TemporaryFrontIcon[] = [];
  for (let depth = 1, deltaDistance = totalDistance / ICON_FACTOR; deltaDistance > ICON_MIN_DISTANCE; depth++, deltaDistance /= ICON_FACTOR) {
    const iconCountAtDepth = ICON_FACTOR ** depth;
    for (let i = 1; i < iconCountAtDepth; i++) {
      // skip already added icons
      if (depth > 1 && i % ICON_FACTOR === 0) {
        continue;
      }

      const distance = i * deltaDistance;
      const positionStartIndex = findLastIndex(cummulativeDistances, x => x <= distance);
      if (positionStartIndex === -1 || positionStartIndex === positions.length - 1) {
        // both overflows are handled by `i % ICON_FACTOR === 0` above
        throw new Error('Invalid state');
      }
      const positionEndIndex = positionStartIndex + 1;
      const positionStart = positions[positionStartIndex];
      const positionEnd = positions[positionEndIndex];
      const cummulativeDistance = cummulativeDistances[positionStartIndex];
  
      const bearing = initialBearing(positionStart, positionEnd);
      const position = destinationPoint(positionStart, distance - cummulativeDistance, bearing) as Position;
      const direction = 90 - bearing;
      const priority = 100 - depth; // top levels have highest priority
  
      icons.push({ distance, position, direction, priority });
    }
  }
  icons = icons.sort((a, b) => a.distance - b.distance);

  const alternatingIcons: FrontIcon<DataT>[] = icons.map((icon, i) => ({ d, ...icon, alternate: i % 2 === 0 }));
  const line = { d, startPosition: path[0], endPosition: path[path.length - 1], icons: alternatingIcons };
  return line;
}