export const OUTLINE_ATTRIBUTION = '<a href="https://www.naturalearthdata.com/">Natural Earth</a>';

const OUTLINE_CACHE = new Map();

export async function loadOutline(url) {
  if (OUTLINE_CACHE.has(url)) {
    return OUTLINE_CACHE.get(url);
  }
  
  const geojson = await (await fetch(url)).json();
  
  // transform polygons to lines
  const isPointValid = point => -85.051129 < point[1] && point[1] < 85.051129;
  geojson.features = geojson.features.map(feature => {
    let newFeature;
    if (feature.geometry.type === 'Polygon') {
      newFeature = {
        ...feature,
        geometry: {
          type: 'MultiLineString',
          coordinates: feature.geometry.coordinates.map(line => {
            return line.filter(isPointValid);
          }),
        },
      };
    } else if (feature.geometry.type === 'MultiPolygon') {
      newFeature = {
        ...feature,
        geometry: {
          type: 'MultiLineString',
          coordinates: feature.geometry.coordinates.map(polygon => {
            return polygon.map(line => {
              return line.filter(isPointValid);
            });
          }).flat(),
        },
      };
    } else {
      newFeature = feature;
    }
      
    const splitAntarctica = feature.geometry.coordinates.length === 1 && feature.geometry.coordinates[0].length !== newFeature.geometry.coordinates[0].length;
    if (splitAntarctica) {
      const index = newFeature.geometry.coordinates[0].findIndex(point => point[0] === -180);
      newFeature.geometry.coordinates = [
        newFeature.geometry.coordinates[0].slice(0, index),
        newFeature.geometry.coordinates[0].slice(index),
      ];
    }

    return newFeature;
  });

  OUTLINE_CACHE.set(url, geojson);
  
  return geojson;
}