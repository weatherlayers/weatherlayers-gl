import SphericalMercator from '@mapbox/sphericalmercator';
import icomesh from 'icomesh';
import KDBush from 'kdbush';
import geokdbush from 'geokdbush';
import {wrapLongitude} from './bounds';

/** @typedef {any} KDBush */

/** @type {Map<number, KDBush>} */
const kdbushIndexCache = new Map();

/**
 * @param {GeoJSON.Position} center
 * @param {number} radius
 * @param {number} zoom
 * @return {GeoJSON.Position[]}
 */
export function generateGlobeGrid(center, radius, zoom) {
  if (!kdbushIndexCache.has(zoom)) {
    // TODO: worker
    const {uv} = icomesh(zoom - 2, true);

    let i = 0;
    const positions = [];
    for (let j = 0; j < uv.length / 2; j++) {
      const point = [uv[i++], uv[i++]];

      // avoid duplicate grid points at the antimeridian
      if (point[0] === 0) {
        continue;
      }
      // avoid invalid grid points at the poles
      // TODO: keep one point, fix grid point direction at the poles
      if (point[1] === 0 || point[1] === 1) {
        continue;
      }

      const position = [point[0] * 360 - 180, point[1] * 180 - 90];

      positions.push(position);
    }

    const kdbushIndex = new KDBush(positions, undefined, undefined, undefined, Float32Array);
    kdbushIndexCache.set(zoom, kdbushIndex);
  }

  const kdbushIndex = /** @type {KDBush} */ (kdbushIndexCache.get(zoom));
  const positions = geokdbush.around(kdbushIndex, center[0], center[1], undefined, radius / 1000);

  return positions;
}

/**
 * @param {GeoJSON.BBox} bounds
 * @param {number} zoom
 * @return {GeoJSON.Position[]}
 */
export function generateGrid(bounds, zoom) {
  const mercator = new SphericalMercator({ size: 1, antimeridian: true });

  const gridBounds = [...mercator.px([bounds[0], bounds[1]], zoom), ...mercator.px([bounds[2], bounds[3]], zoom)];
  [gridBounds[1], gridBounds[3]] = [gridBounds[3], gridBounds[1]];

  const size = 2 ** zoom;
  const lngCount = gridBounds[2] - gridBounds[0] + 1;
  const latCount = gridBounds[3] - gridBounds[1] + 1;

  const positions = [];
  for (let y = 0; y < latCount; y++) {
    for (let x = 0; x < lngCount; x++) {
      const i = gridBounds[0] + x;
      const j = gridBounds[1] + y + (i % 2 === 1 ? 0.5 : 0);
      const point = [i, j];

      // avoid duplicate grid points at the antimeridian
      if (point[0] === 0) {
        continue;
      }
      // avoid invalid grid points at the poles
      if (point[1] === 0 || point[1] === size) {
        continue;
      }

      const position = mercator.ll(point, zoom);
      position[0] = wrapLongitude(position[0]);

      positions.push(position);
    }
  }

  return positions;
}