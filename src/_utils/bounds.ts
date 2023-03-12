/**
 * see https://stackoverflow.com/a/4467559/1823988
 */
function mod(x: number, y: number): number {
  return ((x % y) + y) % y;
}

export function wrapLongitude(lng: number, minLng?: number): number {
  let wrappedLng = mod(lng + 180, 360) - 180;
  if (typeof minLng === 'number' && wrappedLng < minLng) {
    wrappedLng += 360;
  }
  return wrappedLng;
}

export function wrapBounds(bounds: GeoJSON.BBox): GeoJSON.BBox {
  // wrap longitude
  const minLng = bounds[2] - bounds[0] < 360 ? wrapLongitude(bounds[0]) : -180;
  const maxLng = bounds[2] - bounds[0] < 360 ? wrapLongitude(bounds[2], minLng) : 180;
  // clip latitude
  const minLat = Math.max(bounds[1], -85.051129);
  const maxLat = Math.min(bounds[3], 85.051129);

  const mercatorBounds = [minLng, minLat, maxLng, maxLat] satisfies GeoJSON.BBox;
  return mercatorBounds;
}

export function clipBounds(bounds: GeoJSON.BBox): GeoJSON.BBox {
  // fill longitude gap between repeats
  const minLng = bounds[0] - 1;
  const maxLng = bounds[2] + 1;
  // clip latitude
  const minLat = Math.max(bounds[1], -85.051129);
  const maxLat = Math.min(bounds[3], 85.051129);

  const clipBounds = [minLng, minLat, maxLng, maxLat] satisfies GeoJSON.BBox;
  return clipBounds;
}