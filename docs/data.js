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