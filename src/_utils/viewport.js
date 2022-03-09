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
 * @returns {GeoJSON.Position}
 */
export function getViewportGlobeCenter(viewport) {
  return [viewport.longitude, viewport.latitude];
}

/**
 * @param {Viewport} viewport 
 * @returns {number}
 */
export function getViewportGlobeRadius(viewport) {
  const viewportGlobeCenter = getViewportGlobeCenter(viewport);
  const viewportGlobeRadius = Math.max(
    distance(viewportGlobeCenter, viewport.unproject([0, 0])),
    distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, 0])),
    distance(viewportGlobeCenter, viewport.unproject([0, viewport.height / 2])),
  );
  return viewportGlobeRadius;
}

/**
 * @param {Viewport} viewport 
 * @returns {GeoJSON.BBox}
 */
export function getViewportBounds(viewport) {
  return wrapBounds(viewport.getBounds());
}

/**
 * @param {Viewport} viewport 
 * @returns {number}
 */
export function getViewportZoom(viewport) {
  return viewport.zoom + (isViewportGlobe(viewport) ? 1 : 0);
}

/**
 * @param {Viewport} viewport 
 * @param {number} offset
 * @returns {number}
 */
export function getViewportPixelOffset(viewport, offset) {
  return offset * (isViewportGlobe(viewport) ? -1 : 1);
}

/**
 * @param {Viewport} viewport 
 * @param {number} angle
 * @returns {number}
 */
export function getViewportAngle(viewport, angle) {
  return angle + (isViewportGlobe(viewport) ? 180 : 0);
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
 * @returns {GeoJSON.BBox | undefined}
 */
export function getViewportClipBounds(viewport, bounds) {
  return !isViewportGlobe(viewport) ? clipBounds(bounds) : undefined
}