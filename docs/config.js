export const STAC_CATALOG_URL = 'https://api.weatherlayers.com/catalog';
export const STAC_CATALOG_ACCESS_TOKEN = '9djqrhlmAjv2Mv2z2Vwz'; // kamzek-weather token
export const STAC_ASSET_ID = 'byte.png';

const NO_DATA = 'no data';
const DEFAULT_DATASET = 'gfs/wind_10m_above_ground';
const DEFAULT_COLORMAP = 'default';
const DEFAULT_OUTLINE_DATASET = 'ne_110m_land';

function getDatetime(datetimes, datetime) {
  if (datetimes.includes(datetime)) {
    return datetime;
  }

  const closestDatetime = [...datetimes].reverse().find(x => x <= datetime);
  if (!closestDatetime) {
    return datetimes[0] || NO_DATA;
  }

  return closestDatetime;
}

export async function initConfig({ stacCatalog } = {}) {
  const staticConfig = {
    raster: {
      enabled: false,
      opacity: 0.2,
      colormap: DEFAULT_COLORMAP,
      colormapUrl: null,
    },
    particle: {
      enabled: false,
      numParticles: 5000,
      maxAge: 25,
      speedFactor: 2,
      color: [255, 255, 255],
      width: 2,
      opacity: 0.1,
      animate: true,
    },
  };

  const datasetConfigs = new Map([
    ['gfs/wind_10m_above_ground', {
      raster: {
        enabled: true,
      },
      particle: {
        enabled: true,
        maxAge: 25,     // 100,
        speedFactor: 2, // 33 / 100,
      },
    }],
    ['gfs/temperature_2m_above_ground', {
      raster: {
        enabled: true,
      },
    }],
    ['gfs/relative_humidity_2m_above_ground', {
      raster: {
        enabled: true,
      },
    }],
    ['gfs/accumulated_precipitation_next_3h_surface', {
      raster: {
        enabled: true,
      },
    }],
    ['gfs/convective_available_potential_energy_surface', {
      raster: {
        enabled: true,
      },
    }],
    ['gfs/precipitable_water_entire_atmosphere', {
      raster: {
        enabled: true,
      },
    }],
    ['gfs/cloud_water_entire_atmosphere', {
      raster: {
        enabled: true,
      },
    }],
    ['gfs/pressure_mean_sea_level', {
      raster: {
        enabled: true,
      },
    }],
    ['gfs/apparent_temperature_2m_above_ground', {
      raster: {
        enabled: true,
      },
    }],
    ['cams/carbon_monoxide_10m_above_ground', {
      raster: {
        enabled: true,
      },
    }],
    ['cams/sulphur_dioxide_10m_above_ground', {
      raster: {
        enabled: true,
      },
    }],
    ['cams/nitrogen_dioxide_10m_above_ground', {
      raster: {
        enabled: true,
      },
    }],
    ['cams/particulate_matter_2p5um_10m_above_ground', {
      raster: {
        enabled: true,
      },
    }],
    ['cams/particulate_matter_10um_10m_above_ground', {
      raster: {
        enabled: true,
      },
    }],
    ['gfswave/waves', {
      raster: {
        enabled: true,
      },
      particle: {
        enabled: true,
        maxAge: 25,     // 40,
        speedFactor: 1, // 33 / 612,
        width: 5,
      },
    }],
    ['gfswave/significant_wave_height', {
      raster: {
        enabled: true,
      },
    }],
    ['ostia_sst/analysed_sea_surface_temperature', {
      raster: {
        enabled: true,
      },
    }],
    ['ostia_sst/sea_ice_fraction', {
      raster: {
        enabled: true,
      },
    }],
    ['ostia_anom/sea_surface_temperature_anomaly', {
      raster: {
        enabled: true,
      },
    }],
    ['oscar/currents', {
      raster: {
        enabled: true,
      },
      particle: {
        enabled: true,
        maxAge: 25,      // 100,
        speedFactor: 20, // 33 / 7,
      },
    }],
  ]);

  const colormapConfigs = new Map([
    ['BrBG', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/BrBG.png',
    }],
    ['PRGn', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PRGn.png',
    }],
    ['PiYG', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PiYG.png',
    }],
    ['PuOr', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PuOr.png',
    }],
    ['RdBu', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdBu.png',
    }],
    ['RdGy', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdGy.png',
    }],
    ['RdYlBu', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdYlBu.png',
    }],
    ['RdYlGn', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdYlGn.png',
    }],
    ['Spectral', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Spectral.png',
    }],
    ['Blues', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Blues.png',
    }],
    ['Greens', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Greens.png',
    }],
    ['Greys', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Greys.png',
    }],
    ['Oranges', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Oranges.png',
    }],
    ['Purples', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Purples.png',
    }],
    ['Reds', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Reds.png',
    }],
    ['turbo', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/turbo.png',
    }],
    ['viridis', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/viridis.png',
    }],
    ['inferno', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/inferno.png',
    }],
    ['magma', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/magma.png',
    }],
    ['plasma', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/plasma.png',
    }],
    ['cividis', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/cividis.png',
    }],
    ['warm', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/warm.png',
    }],
    ['cool', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/cool.png',
    }],
    ['cubehelix', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/cubehelix.png',
    }],
    ['BuGn', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/BuGn.png',
    }],
    ['BuPu', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/BuPu.png',
    }],
    ['GnBu', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/GnBu.png',
    }],
    ['OrRd', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/OrRd.png',
    }],
    ['PuBuGn', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PuBuGn.png',
    }],
    ['PuBu', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PuBu.png',
    }],
    ['PuRd', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PuRd.png',
    }],
    ['RdPu', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdPu.png',
    }],
    ['YlGnBu', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/YlGnBu.png',
    }],
    ['YlGn', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/YlGn.png',
    }],
    ['YlOrBr', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/YlOrBr.png',
    }],
    ['YlOrRd', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/YlOrRd.png',
    }],
    ['rainbow', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/rainbow.png',
    }],
    ['sinebow', {
      colormapUrl: 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/sinebow.png',
    }],
  ]);

  const outlineConfigs = new Map([
    ['ne_110m_land', {
      datasetUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson',
    }],
    ['ne_50m_land', {
      datasetUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson',
    }],
    ['ne_110m_admin_0_countries', {
      datasetUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson',
    }],
    ['ne_50m_admin_0_countries', {
      datasetUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson',
    }],
  ]);

  const stacCollection = await WeatherLayers.loadStacCollection(stacCatalog, DEFAULT_DATASET);
  const datetimes = WeatherLayers.getStacCollectionDatetimes(stacCollection);
  const datetime = datetimes[datetimes.length - 1];
  const stacItem = await WeatherLayers.loadStacItemByDatetime(stacCollection, datetime);

  const config = {
    staticConfig,
    datasetConfigs,
    colormapConfigs,
    outlineConfigs,

    stacCatalog,
    stacCollection,
    stacItem,
    stacItem2: undefined,
    dataset: DEFAULT_DATASET,
    datetimes: datetimes,
    datetime: datetime,
    datetime2: NO_DATA,
    datetimeWeight: 0,
    rotate: false,

    raster: {
      ...staticConfig.raster,
      ...datasetConfigs.get(DEFAULT_DATASET).raster,
      ...colormapConfigs.get(datasetConfigs.get(DEFAULT_DATASET).raster.colormap),
    },
    particle: {
      ...staticConfig.particle,
      ...datasetConfigs.get(DEFAULT_DATASET).particle,
    },
    outline: {
      enabled: false,
      dataset: DEFAULT_OUTLINE_DATASET,
      color: [255, 255, 255],
      width: 1,
      opacity: 0.5,
      ...outlineConfigs.get(DEFAULT_OUTLINE_DATASET),
    },
  };

  return config;
}

function getDatetimeOptions(datetimes) {
  return datetimes.map(datetime => {
    const formattedDatetime = WeatherLayers.formatDatetime(datetime);
    return { value: datetime, text: formattedDatetime };
  });
}

function updateGuiOptions(gui, object, property, options) {
  const controller = gui.__controllers.find(x => x.object === object && x.property === property);
  const html = options.map(option => `<option value="${option.value}">${option.text}</option>`);

  controller.domElement.children[0].innerHTML = html;

  gui.updateDisplay();
}

function updateGuiDatetimeOptions(gui, object, property, datetimes) {
  const options = getDatetimeOptions(datetimes);
  updateGuiOptions(gui, object, property, options);
}

async function updateDataset(config) {
  const { staticConfig, datasetConfigs, colormapConfigs } = config;

  config.stacCollection = await WeatherLayers.loadStacCollection(config.stacCatalog, config.dataset);
  config.datetimes = WeatherLayers.getStacCollectionDatetimes(config.stacCollection);
  config.datetime = getDatetime(config.datetimes, config.datetime);
  config.stacItem = await WeatherLayers.loadStacItemByDatetime(config.stacCollection, config.datetime);

  const rasterConfig = { ...staticConfig.raster, ...datasetConfigs.get(config.dataset)?.raster };
  Object.keys(rasterConfig).forEach(key => {
    config.raster[key] = rasterConfig[key];
  });

  const colormapConfig = { colormapUrl: undefined, ...colormapConfigs.get(config.raster.colormap) };
  Object.keys(colormapConfig).forEach(key => {
    config.raster[key] = colormapConfig[key];
  });

  const particleConfig = { ...staticConfig.particle, ...datasetConfigs.get(config.dataset)?.particle };
  Object.keys(particleConfig).forEach(key => {
    config.particle[key] = particleConfig[key];
  });
}

async function updateDatetime(config) {
  config.stacItem = await WeatherLayers.loadStacItemByDatetime(config.stacCollection, config.datetime);
}

async function updateDatetime2(config) {
  config.stacItem2 = await WeatherLayers.loadStacItemByDatetime(config.stacCollection, config.datetime2);
}

function updateOutlineDataset(config) {
  const { outlineConfigs } = config;

  const outlineConfig = outlineConfigs.get(config.outline.dataset);
  Object.keys(outlineConfig).forEach(key => {
    config.outline[key] = outlineConfig[key];
  });
}

function updateRasterColormap(config) {
  const { colormapConfigs } = config;

  const colormapConfig = { colormapUrl: undefined, ...colormapConfigs.get(config.raster.colormap) };
  Object.keys(colormapConfig).forEach(key => {
    config.raster[key] = colormapConfig[key];
  });
}

export function initGui(config, update, { deckgl, globe } = {}) {
  const { outlineConfigs, colormapConfigs, datasetConfigs } = config;

  const gui = new dat.GUI();
  gui.width = 300;

  gui.add(config, 'dataset', [NO_DATA, ...datasetConfigs.keys()]).onChange(async () => {
    await updateDataset(config);
    updateGuiDatetimeOptions(gui, config, 'datetime', [NO_DATA, ...config.datetimes]);
    updateGuiDatetimeOptions(gui, config, 'datetime2', [NO_DATA, ...config.datetimes]);
    gui.updateDisplay();
    update();
  });

  gui.add(config, 'datetime', []).onChange(async () => {
    await updateDatetime(config);
    update();
  });
  updateGuiDatetimeOptions(gui, config, 'datetime', [NO_DATA, ...config.datetimes]);
  gui.add(config, 'datetime2', []).onChange(async () => {
    await updateDatetime2(config);
    update();
  });
  updateGuiDatetimeOptions(gui, config, 'datetime2', [NO_DATA, ...config.datetimes]);
  gui.add(config, 'datetimeWeight', 0, 1, 0.01).onChange(update);

  if (globe) {
    gui.add(config, 'rotate').onChange(update);
  }

  gui.add({ 'Docs': () => location.href = 'http://docs.weatherlayers.com/' }, 'Docs');

  const raster = gui.addFolder('Raster layer');
  raster.add(config.raster, 'enabled').onChange(update);
  raster.add(config.raster, 'colormap', [DEFAULT_COLORMAP, ...colormapConfigs.keys()]).onChange(() => {
    updateRasterColormap(config);
    update();
  });
  raster.add(config.raster, 'opacity', 0, 1, 0.01).onChange(update);
  raster.open();

  const particle = gui.addFolder('Particle layer');
  particle.add(config.particle, 'enabled').onChange(update);
  particle.add(config.particle, 'numParticles', 0, 100000, 1).onFinishChange(update);
  particle.add(config.particle, 'maxAge', 1, 255, 1).onFinishChange(update);
  particle.add(config.particle, 'speedFactor', 0.1, 20, 0.1).onChange(update); // 0.05, 5, 0.01
  particle.addColor(config.particle, 'color').onChange(update);
  particle.add(config.particle, 'width', 0.5, 10, 0.5).onChange(update);
  particle.add(config.particle, 'opacity', 0, 1, 0.01).onChange(update);
  particle.add(config.particle, 'animate').onChange(update);
  particle.add({ step: () => deckgl.props.layers.find(x => x.id === 'particle')?.step() }, 'step');
  particle.add({ clear: () => deckgl.props.layers.find(x => x.id === 'particle')?.clear() }, 'clear');
  particle.open();

  const outline = gui.addFolder('Outline layer');
  outline.add(config.outline, 'enabled').onChange(update);
  outline.add(config.outline, 'dataset', [NO_DATA, ...outlineConfigs.keys()]).onChange(async () => {
    updateOutlineDataset(config);
    gui.updateDisplay();
    update();
  });
  outline.addColor(config.outline, 'color').onChange(update);
  outline.add(config.outline, 'width', 0.5, 10, 0.5).onChange(update);
  outline.add(config.outline, 'opacity', 0, 1, 0.01).onChange(update);
  outline.open();

  return gui;
}

export function initFpsMeter() {
  const stats = new Stats();
  stats.showPanel(0);
  stats.dom.style.top = '';
  stats.dom.style.left = '';
  stats.dom.style.right = '0';
  stats.dom.style.bottom = '0';
  document.body.appendChild(stats.dom);
  window.requestAnimationFrame(function updateFps() {
    stats.update();
    window.requestAnimationFrame(updateFps);
  });

  return stats;
}