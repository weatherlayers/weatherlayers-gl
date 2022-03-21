import {ClipExtension} from '@deck.gl/extensions';
import {distance} from './geodesy';
import {wrapBounds, clipBounds} from './bounds';

/** @typedef {any} Viewport */

/**
 * @param {Viewport} viewport 
 * @returns {boolean}
 */
export function isViewportGlobe(viewport) {
  return !!viewport.resolution;
}

/**
 * @param {Viewport} viewport 
 * @returns {GeoJSON.Position | null}
 */
export function getViewportGlobeCenter(viewport) {
  if (!isViewportGlobe(viewport)) {
    return null;
  }

  return [viewport.longitude, viewport.latitude];
}

/**
 * @param {Viewport} viewport 
 * @returns {number | null}
 */
export function getViewportGlobeRadius(viewport) {
  if (!isViewportGlobe(viewport)) {
    return null;
  }

  const viewportGlobeCenter = /** @type {GeoJSON.Position} */ (getViewportGlobeCenter(viewport));
  const viewportGlobeRadius = Math.max(
    distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, 0])),
    distance(viewportGlobeCenter, viewport.unproject([0, viewport.height / 2])),
    ...(viewport.width > viewport.height ? [
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height / 4 * 1, viewport.height / 2])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height / 2 * 1, viewport.height / 2])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height / 4 * 3, viewport.height / 2])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height, viewport.height / 2])),
    ] : [
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width / 4 * 1])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width / 2 * 1])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width / 4 * 3])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width])),
    ])
  );
  return viewportGlobeRadius;
}

/**
 * @param {Viewport} viewport 
 * @returns {GeoJSON.BBox | null}
 */
export function getViewportBounds(viewport) {
  return !isViewportGlobe(viewport) ? wrapBounds(viewport.getBounds()) : null;
}

/**
 * @param {Viewport} viewport 
 * @param {number} offset
 * @returns {number}
 */
export function getViewportPixelOffset(viewport, offset) {
  return offset * (isViewportGlobe(viewport) ? -1 : 1); // TODO: report globe bug
}

/**
 * @param {Viewport} viewport 
 * @param {number} angle
 * @returns {number}
 */
export function getViewportAngle(viewport, angle) {
  return angle + (isViewportGlobe(viewport) ? 180 : 0); // TODO: report globe bug
}

/**
 * @param {Viewport} viewport 
 * @returns {any[]}
 */
export function getViewportClipExtensions(viewport) {
  return !isViewportGlobe(viewport) ? [new ClipExtension()] : [];
}

/**
 * @param {Viewport} viewport 
 * @param {GeoJSON.BBox} bounds
 * @returns {GeoJSON.BBox | null}
 */
export function getViewportClipBounds(viewport, bounds) {
  return !isViewportGlobe(viewport) ? clipBounds(bounds) : null;
}