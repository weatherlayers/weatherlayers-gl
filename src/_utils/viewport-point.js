import KDBush from 'kdbush';
import geokdbush from 'geokdbush';
import {isViewportGlobe, getViewportGlobeCenter, getViewportGlobeRadius, getViewportBounds} from './viewport.js';

/** @typedef {import('./viewport').Viewport} Viewport */
/** @typedef {any} KDBush */

const DEFAULT_RADIUS_PX = 40;
const DEFAULT_RADIUS_KM = 1000;

/** @type {WeakMap<GeoJSON.Feature<GeoJSON.Point>[], Map<number, GeoJSON.Feature<GeoJSON.Point>[]>>} */
const VISIBLE_POINTS_AT_ZOOM_CACHE = new WeakMap();

/** @type {WeakMap<GeoJSON.Feature<GeoJSON.Point>[], Map<number, KDBush>>} */
const VISIBLE_POINT_INDEX_AT_ZOOM_CACHE = new WeakMap();

/**
 * @param {Viewport} viewport
 * @param {GeoJSON.Feature<GeoJSON.Point>[]} points
 * @returns {GeoJSON.Feature<GeoJSON.Point>[]}
 */
export function getViewportVisiblePoints(viewport, points) {
  // remove proximate points hierarchically so that zoom in/out is stable
  if (!VISIBLE_POINTS_AT_ZOOM_CACHE.has(points)) {
    VISIBLE_POINTS_AT_ZOOM_CACHE.set(points, new Map());
  }
  const visiblePointsAtZoomCache = /** @type {Map<number, GeoJSON.Feature<GeoJSON.Point>[]>} */ (VISIBLE_POINTS_AT_ZOOM_CACHE.get(points));

  let visiblePoints = /** @type {GeoJSON.Feature<GeoJSON.Point>[]} */ ([]);
  const maxZoom = Math.floor(viewport.zoom);
  for (let zoom = 0; zoom <= maxZoom; zoom++) {
    if (!visiblePointsAtZoomCache.has(zoom)) {
      const viewportAtZoom = new viewport.constructor({ ...viewport, zoom });

      let visiblePointsAtZoom;
      if (isViewportGlobe(viewport)) {
        visiblePointsAtZoom = getViewportGlobeFilteredPoints(viewportAtZoom, points, visiblePoints);
      } else {
        visiblePointsAtZoom = getViewportFilteredPoints(viewportAtZoom, points, visiblePoints);
      }

      visiblePointsAtZoomCache.set(zoom, visiblePointsAtZoom);
    }
    
    visiblePoints = /** @type {GeoJSON.Feature<GeoJSON.Point>[]} */ (visiblePointsAtZoomCache.get(zoom));
  }

  // find visible points
  if (!VISIBLE_POINT_INDEX_AT_ZOOM_CACHE.has(points)) {
    VISIBLE_POINT_INDEX_AT_ZOOM_CACHE.set(points, new Map());
  }
  const visiblePointIndexAtZoomCache = /** @type {Map<number, KDBush>} */ (VISIBLE_POINT_INDEX_AT_ZOOM_CACHE.get(points));
  if (!visiblePointIndexAtZoomCache.has(maxZoom)) {
    const globalIndex = new KDBush(visiblePoints, x => x.geometry.coordinates[0], x => x.geometry.coordinates[1], undefined, Float32Array);
    visiblePointIndexAtZoomCache.set(maxZoom, globalIndex);
  }
  const globalIndex = /** @type {KDBush} */ (visiblePointIndexAtZoomCache.get(maxZoom));

  if (isViewportGlobe(viewport)) {
    const viewportGlobeCenter = /** @type {GeoJSON.Position} */ (getViewportGlobeCenter(viewport));
    const viewportGlobeRadius = /** @type {number} */ (getViewportGlobeRadius(viewport));
    visiblePoints = geokdbush.around(globalIndex, viewportGlobeCenter[0], viewportGlobeCenter[1], undefined, viewportGlobeRadius / 1000);
  } else {
    const viewportBounds = /** @type {GeoJSON.BBox} */ (getViewportBounds(viewport));
    visiblePoints = [
      ...globalIndex.range(viewportBounds[0], viewportBounds[1], viewportBounds[2], viewportBounds[3]).map(i => visiblePoints[i]),
      ...globalIndex.range(viewportBounds[0] - 360, viewportBounds[1], viewportBounds[2] - 360, viewportBounds[3]).map(i => visiblePoints[i]),
    ];
  }

  return visiblePoints;
}

/**
 * @param {Viewport} viewport
 * @param {GeoJSON.Feature<GeoJSON.Point>[]} points
 * @param {GeoJSON.Feature<GeoJSON.Point>[]} visiblePoints
 * @returns {GeoJSON.Feature<GeoJSON.Point>[]}
 */
function getViewportGlobeFilteredPoints(viewport, points, visiblePoints) {
  const localIndex = new KDBush(points, x => x.geometry.coordinates[0], x => x.geometry.coordinates[1], undefined, Float32Array);
  points = [...points];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (point) {
      const coords = point.geometry.coordinates;
      const closePoints = geokdbush.around(localIndex, coords[0], coords[1], undefined, DEFAULT_RADIUS_KM / 2 ** viewport.zoom);
      for (let j = i + 1; j < points.length; j++) {
        const point2 = points[j];
        if (point2 && closePoints.includes(point2) && !visiblePoints.includes(point2)) {
          points[j] = undefined;
        }
      }
    }
  }
  points = points.filter(x => !!x);
  return points;
}

/**
 * @param {Viewport} viewport
 * @param {GeoJSON.Feature<GeoJSON.Point>[]} points
 * @param {GeoJSON.Feature<GeoJSON.Point>[]} visiblePoints
 * @returns {GeoJSON.Feature<GeoJSON.Point>[]}
 */
function getViewportFilteredPoints(viewport, points, visiblePoints) {
  const localIndex = new KDBush(points.map(x => viewport.project(x.geometry.coordinates)), undefined, undefined, undefined, Float32Array);
  points = [...points];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (point) {
      const coords = viewport.project(point.geometry.coordinates);
      const closePoints = localIndex.within(coords[0], coords[1], DEFAULT_RADIUS_PX).map(i => points[i]);
      for (let j = i + 1; j < points.length; j++) {
        const point2 = points[j];
        if (point2 && closePoints.includes(point2) && !visiblePoints.includes(point2)) {
          points[j] = undefined;
        }
      }
    }
  }
  points = points.filter(x => !!x);
  return points;
}