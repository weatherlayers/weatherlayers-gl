/**
 * @param {number} width
 * @param {number} height
 * @param {GeoJSON.BBox} bounds
 * @returns {(point: GeoJSON.Position) => GeoJSON.Position}
 */
export function getProjectFunction(width, height, bounds) {
  const origin = [bounds[0], bounds[3]]; // top-left
  const lngResolution = (bounds[2] - bounds[0]) / width;
  const latResolution = (bounds[3] - bounds[1]) / height;

  return position => {
    const [lng, lat] = position;
    const x = (lng - origin[0]) / lngResolution;
    const y = -(lat - origin[1]) / latResolution;
    const point = [x, y];
    return point;
  };
}

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
    const [x, y] = point;
    const lng = origin[0] + x * lngResolution;
    const lat = origin[1] - y * latResolution;
    const position = [lng, lat];
    return position;
  };
}