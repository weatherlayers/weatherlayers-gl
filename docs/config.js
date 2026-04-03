import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.1/dist/tweakpane.min.js';

export const NO_DATA = 'no data';

const DEFAULT_DATASET = 'gfs/wind_10m_above_ground';

const DATASETS_WEATHER_WIND = [
  'gfs/wind_10m_above_ground',
  'gfs/wind_100m_above_ground',
  'gfs/wind_tropopause',
  'gfs/wind_gust_surface',
  'hrrr_conus/wind_10m_above_ground',
  'hrrr_conus/wind_80m_above_ground',
  'hrrr_conus/wind_gust_surface',
  'hrrr_alaska/wind_10m_above_ground',
  'hrrr_alaska/wind_80m_above_ground',
  'hrrr_alaska/wind_gust_surface',
  'ecmwf_ifs/wind_10m_above_ground',
  'ecmwf_ifs/wind_100m_above_ground',
  'ecmwf_ifs/wind_gust_surface',
  'ecmwf_aifs/wind_10m_above_ground',
  'ecmwf_aifs/wind_100m_above_ground',
  'meteofrance_arpege/wind_10m_above_ground',
  'meteofrance_arpege/wind_100m_above_ground',
  'meteofrance_arpege/wind_gust_10m_above_ground',
  'meteofrance_arpege_eu/wind_10m_above_ground',
  'meteofrance_arpege_eu/wind_100m_above_ground',
  'meteofrance_arpege_eu/wind_gust_10m_above_ground',
  'meteofrance_arome/wind_10m_above_ground',
  'meteofrance_arome/wind_100m_above_ground',
  'meteofrance_arome/wind_gust_10m_above_ground',
  'meteofrance_arome_hd/wind_10m_above_ground',
  'meteofrance_arome_hd/wind_100m_above_ground',
  'meteofrance_arome_hd/wind_gust_10m_above_ground',
  'metoffice_global/wind_10m_above_ground',
  'metoffice_global/wind_gust_10m_above_ground',
  'metoffice_uk/wind_10m_above_ground',
  'metoffice_uk/wind_gust_10m_above_ground',
];
const DATASETS_WEATHER_TEMPERATURE = [
  'gfs/temperature_2m_above_ground',
  'gfs/temperature_500mb',
  'gfs/apparent_temperature_2m_above_ground',
  'hrrr_conus/temperature_2m_above_ground',
  'hrrr_conus/temperature_500mb',
  'hrrr_alaska/temperature_2m_above_ground',
  'hrrr_alaska/temperature_500mb',
  'ecmwf_ifs/temperature_2m_above_ground',
  'ecmwf_aifs/temperature_2m_above_ground',
  'meteofrance_arpege/temperature_2m_above_ground',
  'meteofrance_arpege_eu/temperature_2m_above_ground',
  'meteofrance_arome/temperature_2m_above_ground',
  'meteofrance_arome_hd/temperature_2m_above_ground',
  'metoffice_global/temperature_surface',
  'metoffice_uk/temperature_surface',
];
const DATASETS_WEATHER_PRESSURE = [
  'gfs/pressure_mean_sea_level',
  'hrrr_conus/pressure_mean_sea_level',
  'hrrr_alaska/pressure_mean_sea_level',
  'ecmwf_ifs/pressure_mean_sea_level',
  'ecmwf_aifs/pressure_mean_sea_level',
  'meteofrance_arpege/pressure_mean_sea_level',
  'meteofrance_arpege_eu/pressure_mean_sea_level',
  'meteofrance_arome/pressure_mean_sea_level',
  'meteofrance_arome_hd/pressure_mean_sea_level',
  'metoffice_global/pressure_mean_sea_level',
  'metoffice_uk/pressure_mean_sea_level',
];
const DATASETS_OCEAN_SEA_SURFACE_TEMPERATURE = [
  'cmems_sst/sea_surface_temperature',
];
const DATASETS_OCEAN_WAVES = [
  'gfswave/waves',
  'gfswave/swell',
  'gfswave/swell2',
  'gfswave/swell3',
  'meteofrance_mfwam/waves',
  'meteofrance_mfwam/swell',
  'meteofrance_mfwam/swell2',
  'meteofrance_mfwam_fr/waves',
  'meteofrance_mfwam_fr/swell',
  'meteofrance_mfwam_fr/swell2',
  'cmems_wav/waves',
  'cmems_wav/swell',
  'cmems_wav/swell2',
  'cmems_wav/swell3',
  'cmems_wav_med/waves',
  'cmems_wav_med/swell',
  'cmems_wav_med/swell2',
  'cmems_wav_med/swell3',
  'cmems_wav_nws/waves',
  'cmems_wav_nws/swell',
  'cmems_wav_nws/swell2',
  'cmems_wav_nws/swell3',
];
const DATASETS_OCEAN_CURRENTS = [
  'cmems_phy/currents',
  'cmems_phy_merged/currents',
  'cmems_phy_merged/tidal_currents',
  'cmems_phy_merged/total_currents',
  'cmems_phy_med/currents',
  'cmems_phy_nws/currents',
];

const CONTOUR_LAYER_DATASET_WEATHER_TEMPERATURE = { interval: 2, majorInterval: 10 };
const CONTOUR_LAYER_DATASET_WEATHER_PRESSURE = { interval: 2, majorInterval: 10 };
const CONTOUR_LAYER_DATASET_OCEAN_SEA_SURFACE_TEMPERATURE = { interval: 2, majorInterval: 10 };
const HIGH_LOW_LAYER_DATASET_WEATHER_PRESSURE = { radius: 2000 };
const GRID_LAYER_DATASET_WEATHER_WIND = { style: WeatherLayers.GridStyle.WIND_BARB, iconBounds: [0, 100 * 0.51444] }; // 100 kts to m/s
const GRID_LAYER_DATASET_WEATHER_TEMPERATURE = { style: WeatherLayers.GridStyle.VALUE };
const GRID_LAYER_DATASET_OCEAN_SEA_SURFACE_TEMPERATURE = { style: WeatherLayers.GridStyle.VALUE };
const GRID_LAYER_DATASET_OCEAN_WAVES = { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 35] };
const GRID_LAYER_DATASET_OCEAN_CURRENTS = { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 3] };
const PARTICLE_LAYER_DATASET_WEATHER_WIND = { speedFactor: 3, width: 2 };
const PARTICLE_LAYER_DATASET_OCEAN_WAVES = { speedFactor: 2, width: 5 };
const PARTICLE_LAYER_DATASET_OCEAN_CURRENTS = { speedFactor: 50, width: 2 };
const TOOLTIP_CONTROL_DATASET_WEATHER_WIND = { directionType: WeatherLayers.DirectionType.INWARD };
const TOOLTIP_CONTROL_DATASET_OCEAN_WAVES = { directionType: WeatherLayers.DirectionType.INWARD };
const TOOLTIP_CONTROL_DATASET_OCEAN_CURRENTS = { directionType: WeatherLayers.DirectionType.OUTWARD };

const CONTOUR_LAYER_DATASET_CONFIG = {
  ...(Object.fromEntries(DATASETS_WEATHER_TEMPERATURE.map(dataset => [dataset, CONTOUR_LAYER_DATASET_WEATHER_TEMPERATURE]))),
  ...(Object.fromEntries(DATASETS_WEATHER_PRESSURE.map(dataset => [dataset, CONTOUR_LAYER_DATASET_WEATHER_PRESSURE]))),
  ...(Object.fromEntries(DATASETS_OCEAN_SEA_SURFACE_TEMPERATURE.map(dataset => [dataset, CONTOUR_LAYER_DATASET_OCEAN_SEA_SURFACE_TEMPERATURE]))),
};
const HIGH_LOW_LAYER_DATASET_CONFIG = {
  ...(Object.fromEntries(DATASETS_WEATHER_PRESSURE.map(dataset => [dataset, HIGH_LOW_LAYER_DATASET_WEATHER_PRESSURE]))),
};
const GRID_LAYER_DATASET_CONFIG = {
  ...(Object.fromEntries(DATASETS_WEATHER_WIND.map(dataset => [dataset, GRID_LAYER_DATASET_WEATHER_WIND]))),
  ...(Object.fromEntries(DATASETS_WEATHER_TEMPERATURE.map(dataset => [dataset, GRID_LAYER_DATASET_WEATHER_TEMPERATURE]))),
  ...(Object.fromEntries(DATASETS_OCEAN_SEA_SURFACE_TEMPERATURE.map(dataset => [dataset, GRID_LAYER_DATASET_OCEAN_SEA_SURFACE_TEMPERATURE]))),
  ...(Object.fromEntries(DATASETS_OCEAN_WAVES.map(dataset => [dataset, GRID_LAYER_DATASET_OCEAN_WAVES]))),
  ...(Object.fromEntries(DATASETS_OCEAN_CURRENTS.map(dataset => [dataset, GRID_LAYER_DATASET_OCEAN_CURRENTS]))),
};
const PARTICLE_LAYER_DATASET_CONFIG = {
  ...(Object.fromEntries(DATASETS_WEATHER_WIND.map(dataset => [dataset, PARTICLE_LAYER_DATASET_WEATHER_WIND]))),
  ...(Object.fromEntries(DATASETS_OCEAN_WAVES.map(dataset => [dataset, PARTICLE_LAYER_DATASET_OCEAN_WAVES]))),
  ...(Object.fromEntries(DATASETS_OCEAN_CURRENTS.map(dataset => [dataset, PARTICLE_LAYER_DATASET_OCEAN_CURRENTS]))),
};
const TOOLTIP_CONTROL_DATASET_CONFIG = {
  ...(Object.fromEntries(DATASETS_WEATHER_WIND.map(dataset => [dataset, TOOLTIP_CONTROL_DATASET_WEATHER_WIND]))),
  ...(Object.fromEntries(DATASETS_OCEAN_WAVES.map(dataset => [dataset, TOOLTIP_CONTROL_DATASET_OCEAN_WAVES]))),
  ...(Object.fromEntries(DATASETS_OCEAN_CURRENTS.map(dataset => [dataset, TOOLTIP_CONTROL_DATASET_OCEAN_CURRENTS]))),
};

const CURRENT_DATETIME = new Date().toISOString();

export async function initConfig({ datasets, deckgl, webgl2, globe } = {}) {
  const urlConfig = new URLSearchParams(location.hash.substring(1));

  const config = {
    datasets: datasets ?? [],
    dataset: urlConfig.get('dataset') ?? DEFAULT_DATASET,
    datetimeRange: WeatherLayers.offsetDatetimeRange(CURRENT_DATETIME, 0, 24).join('/'),
    datetimeStep: 3,
    datetimes: [],
    datetime: NO_DATA,
    ...(deckgl ? {
      datetimeInterpolate: true,
    } : {}),

    imageSmoothing: 0,
    imageInterpolation: deckgl ? WeatherLayers.ImageInterpolation.CUBIC : WeatherLayers.ImageInterpolation.NEAREST,
    imageMinValue: 0, // dataset-specific
    imageMaxValue: 0, // dataset-specific
    unitSystem: WeatherLayers.UnitSystem.METRIC,

    ...(globe ? {
      rotate: false,
    } : {}),

    raster: {
      enabled: false,
      borderEnabled: false,
      borderWidth: 1,
      borderColor: colorToCss(WeatherLayers.DEFAULT_LINE_COLOR),
      gridEnabled: false,
      gridSize: 1,
      gridColor: colorToCss(WeatherLayers.DEFAULT_LINE_COLOR),
      opacity: 0.2,
    },
    contour: {
      enabled: false,
      interval: 2, // dataset-specific
      majorInterval: 10, // dataset-specific
      width: WeatherLayers.DEFAULT_LINE_WIDTH,
      color: colorToCss(WeatherLayers.DEFAULT_LINE_COLOR),
      palette: false,
      // text config is used for labels in standalone demos
      textFontFamily: WeatherLayers.DEFAULT_TEXT_FONT_FAMILY,
      textSize: WeatherLayers.DEFAULT_TEXT_SIZE,
      textColor: colorToCss(WeatherLayers.DEFAULT_TEXT_COLOR),
      textOutlineWidth: WeatherLayers.DEFAULT_TEXT_OUTLINE_WIDTH,
      textOutlineColor: colorToCss(WeatherLayers.DEFAULT_TEXT_OUTLINE_COLOR),
      opacity: 0.2,
    },
    highLow: {
      enabled: false,
      radius: 2000, // dataset-specific
      textFontFamily: WeatherLayers.DEFAULT_TEXT_FONT_FAMILY,
      textSize: WeatherLayers.DEFAULT_TEXT_SIZE,
      textColor: colorToCss(WeatherLayers.DEFAULT_TEXT_COLOR),
      textOutlineWidth: WeatherLayers.DEFAULT_TEXT_OUTLINE_WIDTH,
      textOutlineColor: colorToCss(WeatherLayers.DEFAULT_TEXT_OUTLINE_COLOR),
      palette: false,
      opacity: 0.2,
    },
    ...(deckgl ? {
      grid: {
        enabled: false,
        style: WeatherLayers.GridStyle.VALUE, // dataset-specific
        density: 0,
        textFontFamily: WeatherLayers.DEFAULT_TEXT_FONT_FAMILY,
        textSize: WeatherLayers.DEFAULT_TEXT_SIZE,
        textColor: colorToCss(WeatherLayers.DEFAULT_TEXT_COLOR),
        textOutlineWidth: WeatherLayers.DEFAULT_TEXT_OUTLINE_WIDTH,
        textOutlineColor: colorToCss(WeatherLayers.DEFAULT_TEXT_OUTLINE_COLOR),
        iconBounds: null, // dataset-specific
        iconSize: WeatherLayers.DEFAULT_ICON_SIZE,
        iconColor: colorToCss(WeatherLayers.DEFAULT_ICON_COLOR),
        palette: false,
        opacity: 0.2,
      },
    } : {}),
    ...(webgl2 ? {
      particle: {
        enabled: false,
        numParticles: 5000,
        maxAge: 10,
        speedFactor: 0, // dataset-specific
        width: 0, // dataset-specific
        color: colorToCss(WeatherLayers.DEFAULT_LINE_COLOR),
        palette: false,
        opacity: 0.2,
        animate: true,
      },
    } : {}),
    tooltip: {
      directionType: WeatherLayers.DirectionType.INWARD, // dataset-specific
      directionFormat: WeatherLayers.DirectionFormat.CARDINAL3,
      followCursorOffset: 16,
      followCursorPlacement: WeatherLayers.Placement.BOTTOM,
    },
  };

  loadUrlConfig(config, { deckgl, webgl2 });

  return config;
}

function getOptions(options) {
  return options.map(x => ({ value: x, text: `${x}` }));
}

function getDatetimeRangeOptions(options) {
  return options.map(x => ({ value: WeatherLayers.offsetDatetimeRange(CURRENT_DATETIME, 0, x * 24).join('/'), text: `${x} day${x > 1 ? 's' : ''}` }));
}

function getHourOptions(options) {
  return options.map(x => ({ value: x, text: `${x} hour${x > 1 ? 's' : ''}` }));
}

function getDatetimeOptions(datetimes) {
  return datetimes.map(x => ({ value: x, text: WeatherLayers.formatDatetime(x) }));
}

function loadUrlConfig(config, { deckgl, webgl2 } = {}) {
  const urlConfig = new URLSearchParams(location.hash.substring(1));

  config.raster.enabled = urlConfig.has('raster') ? urlConfig.get('raster') === 'true' : true;

  config.contour.enabled = urlConfig.has('contour') ? urlConfig.get('contour') === 'true' : !!CONTOUR_LAYER_DATASET_CONFIG[config.dataset];
  config.contour.interval = CONTOUR_LAYER_DATASET_CONFIG[config.dataset]?.interval || 2;
  config.contour.majorInterval = CONTOUR_LAYER_DATASET_CONFIG[config.dataset]?.majorInterval || 10;

  config.highLow.enabled = urlConfig.has('highLow') ? urlConfig.get('highLow') === 'true' : !!HIGH_LOW_LAYER_DATASET_CONFIG[config.dataset];
  config.highLow.radius = HIGH_LOW_LAYER_DATASET_CONFIG[config.dataset]?.radius || 2000;

  if (deckgl) {
    config.grid.enabled = urlConfig.has('grid') ? urlConfig.get('grid') === 'true' : !!GRID_LAYER_DATASET_CONFIG[config.dataset];
    config.grid.style = GRID_LAYER_DATASET_CONFIG[config.dataset]?.style || WeatherLayers.GridStyle.VALUE;
    config.grid.iconBounds = GRID_LAYER_DATASET_CONFIG[config.dataset]?.iconBounds || null;
  }

  if (webgl2) {
    config.particle.enabled = urlConfig.has('particle') ? urlConfig.get('particle') === 'true' : !!PARTICLE_LAYER_DATASET_CONFIG[config.dataset];
    config.particle.speedFactor = PARTICLE_LAYER_DATASET_CONFIG[config.dataset]?.speedFactor || 0;
    config.particle.width = PARTICLE_LAYER_DATASET_CONFIG[config.dataset]?.width || 0;
  }

  config.tooltip.directionType = TOOLTIP_CONTROL_DATASET_CONFIG[config.dataset]?.directionType || WeatherLayers.DirectionType.INWARD;
}

function updateUrlConfig(config, { deckgl, webgl2 } = {}) {
  const urlConfig = new URLSearchParams();
  if (config.dataset !== DEFAULT_DATASET) {
    urlConfig.set('dataset', config.dataset);
  }
  if (config.raster.enabled !== true) {
    urlConfig.set('raster', config.raster.enabled);
  }
  if (config.contour.enabled !== !!CONTOUR_LAYER_DATASET_CONFIG[config.dataset]) {
    urlConfig.set('contour', config.contour.enabled);
  }
  if (config.highLow.enabled !== !!HIGH_LOW_LAYER_DATASET_CONFIG[config.dataset]) {
    urlConfig.set('highLow', config.highLow.enabled);
  }
  if (deckgl) {
    if (config.grid.enabled !== !!GRID_LAYER_DATASET_CONFIG[config.dataset]) {
      urlConfig.set('grid', config.grid.enabled);
    }
  }
  if (webgl2) {
    if (config.particle.enabled !== !!PARTICLE_LAYER_DATASET_CONFIG[config.dataset]) {
      urlConfig.set('particle', config.particle.enabled);
    }
  }
  window.history.replaceState(null, null, '#' + urlConfig.toString());
}

function debounce(callback, wait) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

export function initGui(config, update, { deckgl, webgl2, globe } = {}) {
  const originalUpdate = update;
  update = debounce(() => { updateUrlConfig(config, { deckgl, webgl2 }); originalUpdate() }, 100);
  const updateLast = event => event.last && update();

  const gui = new Pane();

  let datetime;
  const updateDatetimes = async () => {
    // force update dataset
    await originalUpdate(true);
    loadUrlConfig(config, { deckgl, webgl2 });
    updateUrlConfig(config, { deckgl, webgl2 });

    // update datetimes
    datetime.dispose();
    datetime = gui.addBinding(config, 'datetime', { options: getDatetimeOptions([NO_DATA, ...config.datetimes]), index: 3 }).on('change', update);
    gui.refresh();

    // force update datetime
    originalUpdate(true);
  };

  gui.addBinding(config, 'dataset', { options: getOptions([NO_DATA, ...config.datasets]) }).on('change', updateDatetimes);
  gui.addBinding(config, 'datetimeRange', { options: getDatetimeRangeOptions([1, 2, 5, 10, 16]) }).on('change', updateDatetimes);
  gui.addBinding(config, 'datetimeStep', { options: getHourOptions([1, 3, 6, 12, 24]) }).on('change', updateDatetimes);
  datetime = gui.addBinding(config, 'datetime', { options: getDatetimeOptions([NO_DATA, ...config.datetimes]) }).on('change', update);
  if (deckgl) {
    gui.addBinding(config, 'datetimeInterpolate').on('change', update);
  }

  gui.addBinding(config, 'imageSmoothing', { min: 0, max: 10, step: 1 }).on('change', update);
  gui.addBinding(config, 'imageInterpolation', { options: getOptions(Object.values(WeatherLayers.ImageInterpolation)) }).on('change', update);
  gui.addBinding(config, 'imageMinValue', { min: 0, max: 1100, step: 0.1 }).on('change', update);
  gui.addBinding(config, 'imageMaxValue', { min: 0, max: 1100, step: 0.1 }).on('change', update);
  gui.addBinding(config, 'unitSystem', { options: getOptions(Object.values(WeatherLayers.UnitSystem)) }).on('change', update);

  if (globe) {
    gui.addBinding(config, 'rotate').on('change', update);
  }

  gui.addButton({ title: 'Demo' }).on('click', () => location.href = 'https://weatherlayers.com/demo.html');
  gui.addButton({ title: 'Integrations' }).on('click', () => location.href = 'https://weatherlayers.com/integrations.html');
  gui.addButton({ title: 'Docs' }).on('click', () => location.href = 'https://docs.weatherlayers.com/');

  const raster = gui.addFolder({ title: 'Raster layer', expanded: true });
  raster.addBinding(config.raster, 'enabled').on('change', update);
  // raster.addBinding(config.raster, 'palette').on('change', update);
  raster.addBinding(config.raster, 'borderEnabled').on('change', update);
  raster.addBinding(config.raster, 'borderWidth', { min: 0.5, max: 10, step: 0.5 }).on('change', update);
  raster.addBinding(config.raster, 'borderColor').on('change', update);
  raster.addBinding(config.raster, 'gridEnabled').on('change', update);
  raster.addBinding(config.raster, 'gridSize', { min: 0.5, max: 10, step: 0.5 }).on('change', update);
  raster.addBinding(config.raster, 'gridColor').on('change', update);
  raster.addBinding(config.raster, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

  const contour = gui.addFolder({ title: 'Contour layer', expanded: true });
  contour.addBinding(config.contour, 'enabled').on('change', update);
  contour.addBinding(config.contour, 'interval', { min: 0, max: 1000, step: 1 }).on('change', update);
  contour.addBinding(config.contour, 'majorInterval', { min: 0, max: 1000, step: 1 }).on('change', update);
  contour.addBinding(config.contour, 'width', { min: 0.5, max: 10, step: 0.5 }).on('change', update);
  contour.addBinding(config.contour, 'color').on('change', update);
  contour.addBinding(config.contour, 'palette').on('change', update);
  contour.addBinding(config.contour, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

  const highLow = gui.addFolder({ title: 'HighLow layer', expanded: true });
  highLow.addBinding(config.highLow, 'enabled').on('change', update);
  highLow.addBinding(config.highLow, 'radius', { min: 0, max: 5 * 1000, step: 1 }).on('change', updateLast);
  highLow.addBinding(config.highLow, 'textSize', { min: 1, max: 20, step: 1 }).on('change', update);
  highLow.addBinding(config.highLow, 'textColor').on('change', update);
  highLow.addBinding(config.highLow, 'textOutlineWidth', { min: 0, max: 1, step: 0.1 }).on('change', update);
  highLow.addBinding(config.highLow, 'textOutlineColor').on('change', update);
  highLow.addBinding(config.highLow, 'palette').on('change', update);
  highLow.addBinding(config.highLow, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

  if (deckgl) {
    const grid = gui.addFolder({ title: 'Grid layer', expanded: true });
    grid.addBinding(config.grid, 'enabled').on('change', update);
    grid.addBinding(config.grid, 'style', { options: getOptions(Object.values(WeatherLayers.GridStyle)) }).on('change', update);
    grid.addBinding(config.grid, 'density', { min: -2, max: 2, step: 1 }).on('change', update);
    grid.addBinding(config.grid, 'textSize', { min: 1, max: 20, step: 1 }).on('change', update);
    grid.addBinding(config.grid, 'textColor').on('change', update);
    grid.addBinding(config.grid, 'textOutlineWidth', { min: 0, max: 1, step: 0.1 }).on('change', update);
    grid.addBinding(config.grid, 'textOutlineColor').on('change', update);
    grid.addBinding(config.grid, 'iconSize', { min: 0, max: 100, step: 1 }).on('change', update);
    grid.addBinding(config.grid, 'iconColor').on('change', update);
    grid.addBinding(config.grid, 'palette').on('change', update);
    grid.addBinding(config.grid, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);
  }

  if (webgl2) {
    const particle = gui.addFolder({ title: 'Particle layer', expanded: true });
    particle.addBinding(config.particle, 'enabled').on('change', update);
    particle.addBinding(config.particle, 'numParticles', { min: 0, max: 100000, step: 1 }).on('change', updateLast);
    particle.addBinding(config.particle, 'maxAge', { min: 0, max: 255, step: 1 }).on('change', updateLast);
    particle.addBinding(config.particle, 'speedFactor', { min: 0, max: 50, step: 0.1 }).on('change', update);
    particle.addBinding(config.particle, 'color').on('change', update);
    particle.addBinding(config.particle, 'palette').on('change', update);
    particle.addBinding(config.particle, 'width', { min: 0.5, max: 10, step: 0.5 }).on('change', update);
    particle.addBinding(config.particle, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);
    particle.addBinding(config.particle, 'animate').on('change', update);
    particle.addButton({ title: 'Step' }).on('click', () => deckgl.layerManager.getLayers({ layerIds: ['particle-line'] })[0]?.step());
    particle.addButton({ title: 'Clear' }).on('click', () => deckgl.layerManager.getLayers({ layerIds: ['particle-line'] })[0]?.clear());
  }

  const tooltip = gui.addFolder({ title: 'Tooltip control', expanded: true });
  tooltip.addBinding(config.tooltip, 'directionType', { options: getOptions(Object.values(WeatherLayers.DirectionType)) }).on('change', update);
  tooltip.addBinding(config.tooltip, 'directionFormat', { options: getOptions(Object.values(WeatherLayers.DirectionFormat)) }).on('change', update);
  tooltip.addBinding(config.tooltip, 'followCursorOffset', { min: 0, max: 50, step: 1 }).on('change', update);
  tooltip.addBinding(config.tooltip, 'followCursorPlacement', { options: getOptions(Object.values(WeatherLayers.Placement)) }).on('change', update);

  return gui;
}

function componentToHex(value) {
  return value.toString(16).padStart(2, '0');
}

function colorToCss(color) {
  return `#${componentToHex(color[0])}${componentToHex(color[1])}${componentToHex(color[2])}${componentToHex(typeof color[3] === 'number' ? color[3] : 255)}`;
}

export function cssToColor(color) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!result) {
    throw new Error('Invalid argument');
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    parseInt(result[4], 16)
   ];
}

export function cssToRgba(color) {
  const rgba = cssToColor(color);
  return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3] / 255})`;
}

export function waitForDeck(getDeck) {
  return new Promise(resolve => {
    function wait() {
      const deck = getDeck();
      if (deck && deck.getCanvas()) {
        resolve(deck);
      } else {
        setTimeout(wait, 100);
      }
    }
    wait();
  });
}

export function isMetalWebGl2() {
  // iOS 15+
  return navigator.maxTouchPoints && navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
}