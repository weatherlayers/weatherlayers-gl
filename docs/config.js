import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.1/dist/tweakpane.min.js';

export const NO_DATA = 'no data';

const DEFAULT_DATASET = 'gfs/wind_10m_above_ground';

const CONTOUR_LAYER_DATASET_CONFIG = {
  'gfs/temperature_2m_above_ground': { interval: 2 },
  'gfs/apparent_temperature_2m_above_ground': { interval: 2 },
  'gfs/pressure_mean_sea_level': { interval: 2 },
  'cmems_sst/sea_surface_temperature': { interval: 2 },
};
const HIGH_LOW_LAYER_DATASET_CONFIG = {
  'gfs/pressure_mean_sea_level': { radius: 2000 },
};
const GRID_LAYER_DATASET_CONFIG = {
  'gfs/wind_10m_above_ground': { style: WeatherLayers.GridStyle.WIND_BARB, iconBounds: [0, 66.8772] },
  'gfs/wind_100m_above_ground': { style: WeatherLayers.GridStyle.WIND_BARB, iconBounds: [0, 66.8772] },
  'gfs/temperature_2m_above_ground': { style: WeatherLayers.GridStyle.VALUE },
  'gfs/apparent_temperature_2m_above_ground': { style: WeatherLayers.GridStyle.VALUE },
  'gfswave/waves': { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 30] },
  'gfswave/swell': { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 30] },
  'gfswave/swell2': { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 30] },
  'gfswave/swell3': { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 30] },
  'cmems_phy/currents': { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 3] },
  'cmems_phy_merged/tidal_currents': { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 3] },
  'cmems_sst/sea_surface_temperature': { style: WeatherLayers.GridStyle.VALUE },
};
const PARTICLE_LAYER_DATASET_CONFIG = {
  'gfs/wind_10m_above_ground': { speedFactor: 3, width: 2 },
  'gfs/wind_100m_above_ground': { speedFactor: 3, width: 2 },
  'gfswave/waves': { speedFactor: 2, width: 5 },
  'gfswave/swell': { speedFactor: 2, width: 5 },
  'gfswave/swell2': { speedFactor: 2, width: 5 },
  'gfswave/swell3': { speedFactor: 2, width: 5 },
  'cmems_phy/currents': { speedFactor: 50, width: 2 },
  'cmems_phy_merged/tidal_currents': { speedFactor: 50, width: 2 },
};

export async function initConfig({ datasets, deckgl, webgl2, globe } = {}) {
  const urlConfig = new URLSearchParams(location.hash.substring(1));

  const config = {
    datasets: datasets ?? [],
    dataset: urlConfig.get('dataset') ?? DEFAULT_DATASET,
    unitSystem: WeatherLayers.UnitSystem.METRIC,
    datetimes: [],
    datetime: NO_DATA,

    ...(deckgl ? {
      datetimeInterpolate: true,
    } : {}),

    imageSmoothing: 0,
    imageInterpolation: deckgl ? WeatherLayers.ImageInterpolation.CUBIC : WeatherLayers.ImageInterpolation.NEAREST,

    ...(globe ? {
      rotate: false,
    } : {}),

    raster: {
      enabled: false,
      palette: true,
      opacity: 0.2,
    },
    contour: {
      enabled: false,
      interval: 2, // dataset-specific
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
        palette: true,
        opacity: 0.2,
        animate: true,
      },
    } : {}),
  };

  loadUrlConfig(config, { deckgl, webgl2 });

  return config;
}

function getOptions(options) {
  return options.map(x => ({ value: x, text: x }));
}

function getDatetimeOptions(datetimes) {
  return datetimes.map(x => ({ value: x, text: WeatherLayers.formatDatetime(x) }));
}

function loadUrlConfig(config, { deckgl, webgl2 } = {}) {
  const urlConfig = new URLSearchParams(location.hash.substring(1));

  config.raster.enabled = urlConfig.has('raster') ? urlConfig.get('raster') === 'true' : true;

  config.contour.enabled = urlConfig.has('contour') ? urlConfig.get('contour') === 'true' : !!CONTOUR_LAYER_DATASET_CONFIG[config.dataset];
  config.contour.interval = CONTOUR_LAYER_DATASET_CONFIG[config.dataset]?.interval || 2;

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
  gui.addBinding(config, 'dataset', { options: getOptions([NO_DATA, ...config.datasets]) }).on('change', async () => {
    // force update dataset
    await originalUpdate();
    loadUrlConfig(config, { deckgl, webgl2 });
    updateUrlConfig(config, { deckgl, webgl2 });

    // refresh datetimes
    datetime.dispose();
    datetime = gui.addBinding(config, 'datetime', { options: getDatetimeOptions([NO_DATA, ...config.datetimes]), index: 1 }).on('change', update);
    gui.refresh();

    // force update datetime
    originalUpdate();
  });
  gui.addBinding(config, 'unitSystem', { options: getOptions(Object.values(WeatherLayers.UnitSystem)) }).on('change', update);

  datetime = gui.addBinding(config, 'datetime', { options: getDatetimeOptions([NO_DATA, ...config.datetimes]) }).on('change', update);

  if (deckgl) {
    gui.addBinding(config, 'datetimeInterpolate').on('change', update);
  }

  gui.addBinding(config, 'imageSmoothing', { min: 0, max: 10, step: 1 }).on('change', update);
  gui.addBinding(config, 'imageInterpolation', { options: getOptions(Object.values(WeatherLayers.ImageInterpolation)) }).on('change', update);

  if (globe) {
    gui.addBinding(config, 'rotate').on('change', update);
  }

  gui.addButton({ title: 'Demo' }).on('click', () => location.href = 'https://weatherlayers.com/demo.html');
  gui.addButton({ title: 'Integrations' }).on('click', () => location.href = 'https://weatherlayers.com/integrations.html');
  gui.addButton({ title: 'Docs' }).on('click', () => location.href = 'https://docs.weatherlayers.com/');

  const raster = gui.addFolder({ title: 'Raster layer', expanded: true });
  raster.addBinding(config.raster, 'enabled').on('change', update);
  raster.addBinding(config.raster, 'palette').on('change', update);
  raster.addBinding(config.raster, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

  const contour = gui.addFolder({ title: 'Contour layer', expanded: true });
  contour.addBinding(config.contour, 'enabled').on('change', update);
  contour.addBinding(config.contour, 'interval', { min: 0, max: 1000, step: 1 }).on('change', update);
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
  highLow.addBinding(config.highLow, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

  if (deckgl) {
    const grid = gui.addFolder({ title: 'Grid layer', expanded: true });
    grid.addBinding(config.grid, 'enabled').on('change', update);
    grid.addBinding(config.grid, 'style', { options: getOptions(Object.values(WeatherLayers.GridStyle)) }).on('change', update);
    grid.addBinding(config.grid, 'density', { min: 0, max: 2, step: 1 }).on('change', update);
    grid.addBinding(config.grid, 'textSize', { min: 1, max: 20, step: 1 }).on('change', update);
    grid.addBinding(config.grid, 'textColor').on('change', update);
    grid.addBinding(config.grid, 'textOutlineWidth', { min: 0, max: 1, step: 0.1 }).on('change', update);
    grid.addBinding(config.grid, 'textOutlineColor').on('change', update);
    grid.addBinding(config.grid, 'iconSize', { min: 0, max: 100, step: 1 }).on('change', update);
    grid.addBinding(config.grid, 'iconColor').on('change', update);
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