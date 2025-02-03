// vector: https://github.com/CartoDB/basemap-styles/blob/master/mapboxgl/dark-matter.json
// raster: https://github.com/CartoDB/basemap-styles/blob/master/cartocss/web-styles/dark-matter.tm2/style.mss

export const BASEMAP_RASTER_STYLE_URL = 'https://tiles.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png';
export const BASEMAP_VECTOR_STYLE_URL = 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
export const BASEMAP_VECTOR_LAYER_BEFORE_ID = 'waterway_label';
export const BASEMAP_ATTRIBUTION = '© <a href="https://carto.com/about-carto/" target="_blank" rel="noopener">CARTO</a>, © <a href="http://www.openstreetmap.org/about/" target="_blank">OpenStreetMap</a> contributors';

const TEXT_LAYERS = [
  'place_hamlet',
  'place_suburbs',
  'place_villages',
  'place_town',
  'place_country_2',
  'place_country_1',
  'place_state',
  'place_continent',
  'place_city_r6',
  'place_city_r5',
  'place_city_dot_r7',
  'place_city_dot_r4',
  'place_city_dot_r2',
  'place_city_dot_z7',
  'place_capital_dot_z7',
  'watername_ocean',
  'watername_sea',
  'watername_lake',
  'watername_lake_line',
  'waterway_label',
];

const LINE_LAYERS = [
  'waterway',
  'boundary_county',
  'boundary_state',
  'boundary_country_outline',
  'boundary_country_inner',
];

const FILL_LAYERS = [
  'water',
];

export function updateBasemapVectorStyle(map) {
  for (let layer of TEXT_LAYERS) {
    map.setPaintProperty(layer, 'text-color', '#ccc');
  }
  for (let layer of LINE_LAYERS) {
    map.setPaintProperty(layer, 'line-color', '#222');
  }
  for (let layer of FILL_LAYERS) {
    map.setPaintProperty(layer, 'fill-color', '#222');
  }
}