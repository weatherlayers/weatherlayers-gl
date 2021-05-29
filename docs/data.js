const ACCESS_TOKEN = '9djqrhlmAjv2Mv2z2Vwz'; // kamzek-weather token
const DATASETS_URL = 'https://weather-api.kamzek.com/datasets';
const COLORMAP_URL = 'https://weather-config.kamzek.com/colormaps';
const DATA_URL = 'https://weather-api.kamzek.com/data';

export async function loadDatasets() {
  const url = `${DATASETS_URL}?access_token=${ACCESS_TOKEN}`;
  return (await fetch(url)).json();
}

export function getColormapUrl(datasetName) {
  const url = `${COLORMAP_URL}/${datasetName.replace('/', '_')}.png`;
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

export async function fixMapGeoJsonUrl(url) {
  const geojson = await (await fetch(url)).json();

  geojson.features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates = feature.geometry.coordinates.map(polygon => {
        return polygon.map(point => {
          return [point[0], Math.min(Math.max(point[1], -85.051129), 85.051129)];
        });
      });
    }
  });

  const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
  const blobUrl = URL.createObjectURL(blob);

  return blobUrl;
}

export async function fixGlobeGeoJsonUrl(url) {
  const geojson = await (await fetch(url)).json();

  geojson.features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates = feature.geometry.coordinates.map(polygon => {
        const filteredPolygon = polygon.filter(point => -85.051129 < point[1] && point[1] < 85.051129);
        if (polygon.length !== filteredPolygon.length) {
          const fixedPolygon = filteredPolygon.map(point => {
            return [
              ...(point[0] === -180 ? [[point[0], Math.sign(point[1]) * 90]] : []),
              point,
              ...(point[0] === 180 ? [[point[0], Math.sign(point[1]) * 90]] : []),
            ];
          }).flat();
          return fixedPolygon;
        } else {
          return polygon;
        }
      });
    }
  });

  const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
  const blobUrl = URL.createObjectURL(blob);

  return blobUrl;
}