export type ProjectFunction = (point: GeoJSON.Position) => GeoJSON.Position;

export function getProjectFunction(width: number, height: number, bounds: GeoJSON.BBox): ProjectFunction {
  const origin = [bounds[0], bounds[3]]; // top-left
  const lngResolution = (bounds[2] - bounds[0]) / width;
  const latResolution = (bounds[3] - bounds[1]) / height;

  return position => {
    const [lng, lat] = position;
    const x = (lng - origin[0]) / lngResolution;
    const y = (origin[1] - lat) / latResolution;
    const point = [x, y];
    return point;
  };
}

export function getUnprojectFunction(width: number, height: number, bounds: GeoJSON.BBox): ProjectFunction {
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