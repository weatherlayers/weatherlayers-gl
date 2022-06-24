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
    const lng = position[0];
    const lat = position[1];

    // Offset (test case: Gibraltar)
    const i = (lng - origin[0]) / lngResolution + 0.5;
    const j = -(lat - origin[1]) / latResolution + 0.5;

    const point = [i, j];
    return point;
  };
}