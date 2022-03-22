import SphericalMercator from '@mapbox/sphericalmercator';
import icomesh from 'icomesh';
import KDBush from 'kdbush';
import geokdbush from 'geokdbush';
import {isViewportGlobe, getViewportGlobeCenter, getViewportGlobeRadius, getViewportBounds} from './viewport';
import {wrapLongitude} from './bounds';

/** @typedef {import('./viewport').Viewport} Viewport */
/** @typedef {any} KDBush */

/** @type {Map<number, KDBush>} */
const ICOMESH_INDEX_AT_ZOOM_CACHE = new Map();

/**
 * @param {Viewport} viewport
 * @param {number} [zoomOffset]
 * @return {GeoJSON.Position[]}
 */
export function getViewportVisibleGrid(viewport, zoomOffset = 0) {
  const zoom = Math.floor(viewport.zoom + (isViewportGlobe(viewport) ? 1 : 0) + zoomOffset);
  /** @type {GeoJSON.Position[]} */
  let positions;
  if (isViewportGlobe(viewport)) {
    const viewportGlobeCenter = /** @type {GeoJSON.Position} */ (getViewportGlobeCenter(viewport));
    const viewportGlobeRadius = /** @type {number} */ (getViewportGlobeRadius(viewport));
    positions = generateGlobeGrid(viewportGlobeCenter, viewportGlobeRadius, zoom);
  } else {
    const viewportBounds = /** @type {GeoJSON.BBox} */ (getViewportBounds(viewport));
    positions = generateGrid(viewportBounds, zoom);
  }
  return positions;
}

/**
 * @param {GeoJSON.Position} center
 * @param {number} radius
 * @param {number} zoom
 * @return {GeoJSON.Position[]}
 */
function generateGlobeGrid(center, radius, zoom) {
  // icomesh performance
  // order 0 - 0.03 ms
  // order 1 - 0.40 ms
  // order 2 - 0.16 ms
  // order 3 - 0.59 ms
  // order 4 - 2.35 ms
  // order 5 - 7.27 ms
  // order 6 - 29.68 ms
  // order 7 - 66.05 ms
  // order 8 - 127.02 ms
  // order 9 - 555.85 ms
  // order 10 - 2460.47 ms
  // TODO: generate local icomesh
  const MAX_ICOMESH_ZOOM = 7;
  zoom = Math.min(Math.max(zoom - 2, 0), MAX_ICOMESH_ZOOM);

  if (!ICOMESH_INDEX_AT_ZOOM_CACHE.has(zoom)) {
    const {uv} = icomesh(zoom, true);

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
      if (point[1] <= 0 || point[1] >= 1) {
        continue;
      }

      const position = [point[0] * 360 - 180, point[1] * 180 - 90];

      positions.push(position);
    }

    const globalIndex = new KDBush(positions, undefined, undefined, undefined, Float32Array);
    ICOMESH_INDEX_AT_ZOOM_CACHE.set(zoom, globalIndex);
  }

  const globalIndex = /** @type {KDBush} */ (ICOMESH_INDEX_AT_ZOOM_CACHE.get(zoom));
  const positions = geokdbush.around(globalIndex, center[0], center[1], undefined, radius / 1000);

  return positions;
}

/**
 * @param {GeoJSON.BBox} bounds
 * @param {number} zoom
 * @return {GeoJSON.Position[]}
 */
function generateGrid(bounds, zoom) {
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
      const j = gridBounds[1] + y + (i % 2 === 1 ? 0.5 : 0); // triangle grid
      const point = [i, j];

      // avoid duplicate grid points at the antimeridian
      if (point[0] === 0) {
        continue;
      }
      // avoid invalid grid points at the poles
      if (point[1] <= 0 || point[1] >= size) {
        continue;
      }

      const position = mercator.ll(point, zoom);
      position[0] = wrapLongitude(position[0]);

      positions.push(position);
    }
  }

  return positions;
}