export const NO_DATA = 'no data';

const DEFAULT_DATASET = 'gfs/wind_10m_above_ground';
const DEFAULT_COLORMAP = 'default';

const CONTOUR_LAYER_DATASET_CONFIG = {
  'gfs/pressure_mean_sea_level': { interval: 2 },
  'gfs/temperature_2m_above_ground': { interval: 2 },
  'gfs/apparent_temperature_2m_above_ground': { interval: 2 },
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
  'cmems_sst/sea_surface_temperature': { style: WeatherLayers.GridStyle.VALUE },
  'gfswave/waves': { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 30] },
  'cmems_phy/currents': { style: WeatherLayers.GridStyle.ARROW, iconBounds: [0, 3] },
};
const PARTICLE_LAYER_DATASET_CONFIG = {
  'gfs/wind_10m_above_ground': { speedFactor: 3, width: 2 },
  'gfs/wind_100m_above_ground': { speedFactor: 3, width: 2 },
  'gfswave/waves': { speedFactor: 2, width: 5 },
  'cmems_phy/currents': { speedFactor: 50, width: 2 },
};

export async function initConfig({ client, deckgl, webgl2, globe } = {}) {
  const urlConfig = new URLSearchParams(location.hash.substring(1));

  const datasets = client ? await client.loadCatalog() : [];

  const config = {
    client,
    datasets,
    dataset: urlConfig.get('dataset') ?? DEFAULT_DATASET,
    datetimes: [],
    datetime: new Date().toISOString(),
    ...(deckgl ? {
      datetimeInterpolate: true,
      imageSmoothing: 0,
      imageInterpolation: WeatherLayers.ImageInterpolation.CUBIC,
    } : {}),
    ...(globe ? {
      rotate: false,
    } : {}),

    raster: {
      enabled: false,
      colormap: DEFAULT_COLORMAP,
      opacity: 0.2,
    },
    contour: {
      enabled: false,
      interval: 2, // dataset-specific
      width: WeatherLayers.DEFAULT_LINE_WIDTH,
      color: arrayToColor(WeatherLayers.DEFAULT_LINE_COLOR),
      // text config is used for labels in standalone demos
      textFontFamily: WeatherLayers.DEFAULT_TEXT_FONT_FAMILY,
      textSize: WeatherLayers.DEFAULT_TEXT_SIZE,
      textColor: arrayToColor(WeatherLayers.DEFAULT_TEXT_COLOR),
      textOutlineWidth: WeatherLayers.DEFAULT_TEXT_OUTLINE_WIDTH,
      textOutlineColor: arrayToColor(WeatherLayers.DEFAULT_TEXT_OUTLINE_COLOR),
      opacity: 1,
    },
    highLow: {
      enabled: false,
      radius: 2000, // dataset-specific
      textFontFamily: WeatherLayers.DEFAULT_TEXT_FONT_FAMILY,
      textSize: WeatherLayers.DEFAULT_TEXT_SIZE,
      textColor: arrayToColor(WeatherLayers.DEFAULT_TEXT_COLOR),
      textOutlineWidth: WeatherLayers.DEFAULT_TEXT_OUTLINE_WIDTH,
      textOutlineColor: arrayToColor(WeatherLayers.DEFAULT_TEXT_OUTLINE_COLOR),
      opacity: 1,
    },
    ...(deckgl ? {
      grid: {
        enabled: false,
        style: WeatherLayers.GridStyle.VALUE, // dataset-specific
        textFontFamily: WeatherLayers.DEFAULT_TEXT_FONT_FAMILY,
        textSize: WeatherLayers.DEFAULT_TEXT_SIZE,
        textColor: arrayToColor(WeatherLayers.DEFAULT_TEXT_COLOR),
        textOutlineWidth: WeatherLayers.DEFAULT_TEXT_OUTLINE_WIDTH,
        textOutlineColor: arrayToColor(WeatherLayers.DEFAULT_TEXT_OUTLINE_COLOR),
        iconBounds: null, // dataset-specific
        iconSize: WeatherLayers.DEFAULT_ICON_SIZE,
        iconColor: arrayToColor(WeatherLayers.DEFAULT_ICON_COLOR),
        opacity: 1,
      },
    } : {}),
    ...(webgl2 ? {
      particle: {
        enabled: false,
        numParticles: 5000,
        maxAge: 10,
        speedFactor: 0, // dataset-specific
        width: 0, // dataset-specific
        color: arrayToColor(WeatherLayers.DEFAULT_LINE_COLOR),
        opacity: 1,
        animate: true,
      },
    } : {}),
  };

  await updateDataset(config, { deckgl, webgl2, globe });

  return config;
}

function getOptions(options) {
  return options.map(x => ({ value: x, text: x }));
}

function getDatetimeOptions(datetimes) {
  return datetimes.map(x => ({ value: x, text: WeatherLayers.formatDatetime(x) }));
}

async function updateDataset(config, { deckgl, webgl2 } = {}) {
  const { client } = config;
  const urlConfig = new URLSearchParams(location.hash.substring(1));

  config.datetimes = client ? (await client.loadDataset(config.dataset)).datetimes : [];
  config.datetime = config.datetimes[0] ?? NO_DATA;

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
  update = debounce(() => { updateUrlConfig(config, { deckgl }); originalUpdate() }, 100);
  const updateLast = event => event.last && update();

  const gui = new Tweakpane.Pane();

  let datetime;
  gui.addInput(config, 'dataset', { options: getOptions([NO_DATA, ...config.datasets]) }).on('change', async () => {
    await updateDataset(config, { deckgl, webgl2, globe });
    datetime.dispose();
    datetime = gui.addInput(config, 'datetime', { options: getDatetimeOptions([NO_DATA, ...config.datetimes]), index: 1 }).on('change', update);
    gui.refresh();
    update();
  });

  datetime = gui.addInput(config, 'datetime', { options: getDatetimeOptions([NO_DATA, ...config.datetimes]) }).on('change', update);

  if (deckgl) {
    gui.addInput(config, 'datetimeInterpolate').on('change', update);
    gui.addInput(config, 'imageSmoothing', { min: 0, max: 10, step: 1 }).on('change', update);
    gui.addInput(config, 'imageInterpolation', { options: getOptions(Object.values(WeatherLayers.ImageInterpolation)) }).on('change', update);
  }

  if (globe) {
    gui.addInput(config, 'rotate').on('change', update);
  }

  gui.addButton({ title: 'Catalog' }).on('click', () => location.href = 'https://browser.weatherlayers.com/');
  gui.addButton({ title: 'Docs' }).on('click', () => location.href = 'https://docs.weatherlayers.com/');

  const raster = gui.addFolder({ title: 'Raster layer', expanded: true });
  raster.addInput(config.raster, 'enabled').on('change', update);
  raster.addInput(config.raster, 'colormap', { options: getOptions([DEFAULT_COLORMAP]) }); // dummy
  raster.addInput(config.raster, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

  const contour = gui.addFolder({ title: 'Contour layer', expanded: true });
  contour.addInput(config.contour, 'enabled').on('change', update);
  contour.addInput(config.contour, 'interval', { min: 0, max: 1000, step: 1 }).on('change', update);
  contour.addInput(config.contour, 'width', { min: 0.5, max: 10, step: 0.5 }).on('change', update);
  contour.addInput(config.contour, 'color').on('change', update);
  contour.addInput(config.contour, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

  const highLow = gui.addFolder({ title: 'HighLow layer', expanded: true });
  highLow.addInput(config.highLow, 'enabled').on('change', update);
  highLow.addInput(config.highLow, 'radius', { min: 0, max: 5 * 1000, step: 1 }).on('change', updateLast);
  highLow.addInput(config.highLow, 'textSize', { min: 1, max: 20, step: 1 }).on('change', update);
  highLow.addInput(config.highLow, 'textColor').on('change', update);
  highLow.addInput(config.highLow, 'textOutlineWidth', { min: 0, max: 1, step: 0.1 }).on('change', update);
  highLow.addInput(config.highLow, 'textOutlineColor').on('change', update);
  highLow.addInput(config.highLow, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

  if (deckgl) {
    const grid = gui.addFolder({ title: 'Grid layer', expanded: true });
    grid.addInput(config.grid, 'enabled').on('change', update);
    grid.addInput(config.grid, 'style', { options: getOptions(Object.values(WeatherLayers.GridStyle)) }).on('change', update);
    grid.addInput(config.grid, 'textSize', { min: 1, max: 20, step: 1 }).on('change', update);
    grid.addInput(config.grid, 'textColor').on('change', update);
    grid.addInput(config.grid, 'textOutlineWidth', { min: 0, max: 1, step: 0.1 }).on('change', update);
    grid.addInput(config.grid, 'textOutlineColor').on('change', update);
    grid.addInput(config.grid, 'iconSize', { min: 0, max: 100, step: 1 }).on('change', update);
    grid.addInput(config.grid, 'iconColor').on('change', update);
    grid.addInput(config.grid, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);
  }

  if (webgl2) {
    const particle = gui.addFolder({ title: 'Particle layer', expanded: true });
    particle.addInput(config.particle, 'enabled').on('change', update);
    particle.addInput(config.particle, 'numParticles', { min: 0, max: 100000, step: 1 }).on('change', updateLast);
    particle.addInput(config.particle, 'maxAge', { min: 0, max: 255, step: 1 }).on('change', updateLast);
    particle.addInput(config.particle, 'speedFactor', { min: 0, max: 50, step: 0.1 }).on('change', update);
    particle.addInput(config.particle, 'color').on('change', update);
    particle.addInput(config.particle, 'width', { min: 0.5, max: 10, step: 0.5 }).on('change', update);
    particle.addInput(config.particle, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);
    particle.addInput(config.particle, 'animate').on('change', update);
    particle.addButton({ title: 'Step' }).on('click', () => deckgl.layerManager.getLayers({ layerIds: ['particle-line'] })[0]?.step());
    particle.addButton({ title: 'Clear' }).on('click', () => deckgl.layerManager.getLayers({ layerIds: ['particle-line'] })[0]?.clear());
  }

  return gui;
}

export function arrayToColor(color) {
  return { r: color[0], g: color[1], b: color[2], a: typeof color[3] === 'number' ? color[3] / 255 : 1 };
}

export function colorToArray(color) {
  return [color.r, color.g, color.b, ...(typeof color.a === 'number' ? [color.a * 255] : [255])];
}

export function colorToCss(color) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${typeof color.a === 'number' ? color.a : 1 })`;
}

export function isMetalWebGl2() {
  // iOS 15+
  return navigator.maxTouchPoints && navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
}