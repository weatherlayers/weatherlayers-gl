import type {Position} from '@deck.gl/core/typed';
import {distance as measureDistance, destinationPoint, initialBearing} from '../../../_utils/geodesy.js';

const ICON_DISTANCE = 5000;

export interface TemporaryFrontIcon {
  distance: number;
  position: Position;
  direction: number;
  priority: number;
}

export interface FrontIcon<DataT> {
  d: DataT;
  index: number;
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

  // add labels to minimize overlaps, pick odd values from each level
  //        1       <- depth 1
  //    1   2   3   <- depth 2
  //  1 2 3 4 5 6 7 <- depth 3
  let delta = 0.5 * totalDistance; // spacing between points at level
  let depth = 1;
  let icons: TemporaryFrontIcon[] = [];
  while (delta > ICON_DISTANCE) {
    for (let i = 1; i < 2 ** depth; i += 2) {
      const distance = i * delta;
      // let offset = 1;
      // if (distance > 0.5 * totalDistance) {
      //   offset *= -1;
      // }
      const [j, cummulativeDistance] = cummulativeDistances.find(([_, cummulativeDistance]) => distance >= cummulativeDistance)!;
      const currentPosition = positions[j];
      const nextPosition = positions[j + 1];
  
      const bearing = initialBearing(currentPosition, nextPosition);
      const position = destinationPoint(currentPosition, distance - cummulativeDistance, bearing) as Position;
      const direction = 90 - bearing;
      const priority = 100 - depth; // top levels have highest priority
  
      icons.push({ distance, position, direction, priority });
    }
    depth++;
    delta /= 2;
  }
  icons = icons.sort((a, b) => a.distance - b.distance);

  return icons.map((icon, i) => ({ d, index: i, ...icon, distance: undefined })) satisfies FrontIcon<DataT>[];
}