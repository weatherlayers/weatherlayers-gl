const ACCESS_TOKEN = '9djqrhlmAjv2Mv2z2Vwz'; // kamzek-weather token
const DATASETS_URL = 'https://weather-api.kamzek.com/datasets';
const COLORMAP_URL = 'https://weather-config.kamzek.com/colormaps';
const DATA_URL = 'https://weather-api.kamzek.com/data';

export async function loadDatasets() {
  const url = `${DATASETS_URL}?access_token=${ACCESS_TOKEN}`;
  return (await fetch(url)).json();
}

export function getColormapUrl(colormap) {
  const url = `${COLORMAP_URL}/${colormap}.png`;
  return url;
}

export function getDataUrl(datasets, datasetName, datetime) {
  const dataset = datasets.find(x => x.name === datasetName);
  if (!dataset) {
    return;
  }
  if (!dataset.datetimes.includes(datetime)) {
    return;
  }

  const url = `${DATA_URL}/${datasetName}/${datetime}.png?access_token=${ACCESS_TOKEN}`;
  return url;
}

export async function loadLand() {
  const isPointValid = point => -85.051129 < point[1] && point[1] < 85.051129;

  const url = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson';
  const geojson = await (await fetch(url)).json();

  // transform polygons to lines
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
  
  return geojson;
}