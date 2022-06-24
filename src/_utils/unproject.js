/**
 * @param {number} width
 * @param {number} height
 * @param {GeoJSON.BBox} bounds
 * @returns {(point: GeoJSON.Position) => GeoJSON.Position}
 */
export function getUnprojectFunction(width, height, bounds) {
  const origin = [bounds[0], bounds[3]]; // top-left
  const lngResolution = (bounds[2] - bounds[0]) / width;
  const latResolution = (bounds[3] - bounds[1]) / height;

  return point => {
    const i = point[0];
    const j = point[1];

    // Offset (test case: Gibraltar)
    const lng = origin[0] + (i - 0.5) * lngResolution;
    const lat = origin[1] - (j - 0.5) * latResolution;

    const position = [lng, lat];
    return position;
  };
}