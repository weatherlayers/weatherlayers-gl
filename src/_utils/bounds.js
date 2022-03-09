/**
 * see https://stackoverflow.com/a/4467559/1823988
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function mod(x, y) {
  return ((x % y) + y) % y;
}

/**
 * @param {number} lng
 * @param {number} [minLng]
 * @returns {number}
 */
export function wrapLongitude(lng, minLng = undefined) {
  let wrappedLng = mod(lng + 180, 360) - 180;
  if (typeof minLng === 'number' && wrappedLng < minLng) {
    wrappedLng += 360;
  }
  return wrappedLng;
}

/**
 * @param {GeoJSON.BBox} bounds
 * @returns {GeoJSON.BBox}
 */
export function wrapBounds(bounds) {
  // wrap longitude
  const minLng = bounds[2] - bounds[0] < 360 ? wrapLongitude(bounds[0]) : -180;
  const maxLng = bounds[2] - bounds[0] < 360 ? wrapLongitude(bounds[2], minLng) : 180;
  // clip latitude
  const minLat = Math.max(bounds[1], -85.051129);
  const maxLat = Math.min(bounds[3], 85.051129);

  const mercatorBounds = /** @type {GeoJSON.BBox} */ ([minLng, minLat, maxLng, maxLat]);
  return mercatorBounds;
}

/**
 * @param {GeoJSON.BBox} bounds
 * @returns {GeoJSON.BBox}
 */
export function clipBounds(bounds) {
  // fill longitude gap between repeats
  const minLng = bounds[0] - 1;
  const maxLng = bounds[2] + 1;
  // clip latitude
  const minLat = Math.max(bounds[1], -85.051129);
  const maxLat = Math.min(bounds[3], 85.051129);

  const clipBounds = /** @type {GeoJSON.BBox} */ ([minLng, minLat, maxLng, maxLat]);
  return clipBounds;
}