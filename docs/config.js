const DEFAULT_DATASET = 'gfs/wind_10m_above_ground';

function getDatetimes(datasets, datasetName) {
  const dataset = datasets.find(x => x.name === datasetName);
  if (!dataset) {
    return [];
  }

  const datetimes = dataset.datetimes;
  return datetimes;
}

export function initConfig({ datasets } = {}) {
  const staticConfig = {
    raster: {
      opacity: 0.2,
      imageBounds: null,
      colorBounds: null,
      colormap: null,
      legendWidth: 220,
      legendTitle: null,
      legendTicksCount: 6,
      legendValueFormat: null,
      vector: false,
      attribution: null,
    },
    particle: {
      numParticles: 5000,
      maxAge: 25,
      speedFactor: 2,
      color: [255, 255, 255],
      width: 2,
      opacity: 0.1,
      animate: true,
    },
  };

  const rasterConfigs = new Map([
    ['gfs/wind_10m_above_ground', {
      imageBounds: [-128, 127],
      colorBounds: [0, 100],
      colormap: 'gfs/wind',
      legendTitle: 'Wind [m/s]',
      vector: true,
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    }],
    ['gfs/temperature_2m_above_ground', {
      imageBounds: [193 - 273.15, 328 - 273.15],
      colorBounds: [193 - 273.15, 328 - 273.15],
      colormap: 'gfs/temperature',
      legendTitle: 'Temperature [°C]',
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    }],
    ['gfs/relative_humidity_2m_above_ground', {
      imageBounds: [0, 100],
      colorBounds: [0, 100],
      colormap: 'gfs/relative_humidity',
      legendTitle: 'Relative Humidity [%]',
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    }],
    // ['gfs/accumulated_precipitation_surface', {
    //   imageBounds: [0, 150],
    //   colorBounds: [0, 150],
    //   colormap: 'gfs/accumulated_precipitation',
    //   legendTitle: 'Precipitation Accumulation [kg/m²]',
    //   attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    // }],
    ['gfs/accumulated_precipitation_next_3h_surface', {
      imageBounds: [0, 150],
      colorBounds: [0, 150],
      colormap: 'gfs/accumulated_precipitation',
      legendTitle: '3-hour Precipitation Accumulation [kg/m²]',
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    }],
    ['gfs/convective_available_potential_energy_surface', {
      imageBounds: [0, 5000],
      colorBounds: [0, 5000],
      colormap: 'gfs/convective_available_potential_energy',
      legendTitle: 'Convective Available Potential Energy [J/kg]',
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    }],
    ['gfs/precipitable_water_entire_atmosphere', {
      imageBounds: [0, 70],
      colorBounds: [0, 70],
      colormap: 'gfs/precipitable_water',
      legendTitle: 'Total Precipitable Water [kg/m²]',
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    }],
    ['gfs/cloud_water_entire_atmosphere', {
      imageBounds: [0, 1],
      colorBounds: [0, 1],
      colormap: 'gfs/cloud_water',
      legendTitle: 'Total Cloud Water [kg/m²]',
      legendValueDecimals: 1,
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    }],
    ['gfs/pressure_mean_sea_level', {
      imageBounds: [92000, 105000],
      colorBounds: [92000, 105000],
      colormap: 'gfs/pressure',
      legendTitle: 'Mean Sea Level Pressure [hPa]',
      legendValueFormat: value => value / 100,
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    }],
    ['gfs/apparent_temperature_2m_above_ground', {
      imageBounds: [236 - 273.15, 332 - 273.15],
      colorBounds: [236 - 273.15, 332 - 273.15],
      colormap: 'gfs/apparent_temperature',
      legendTitle: 'Apparent Temperature [°C]',
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    }],
    ['cams/carbon_monoxide_10m_above_ground', {
      imageBounds: [0.0044e-6, 9.4e-6],
      colorBounds: [0.0044e-6, 9.4e-6],
      colormap: 'cams/carbon_monoxide',
      legendTitle: 'CO [μg/m³]',
      legendValueFormat: value => value * 1000000000,
      attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
    }],
    ['cams/sulphur_dioxide_10m_above_ground', {
      imageBounds: [0.035e-9, 75e-9],
      colorBounds: [0.035e-9, 75e-9],
      colormap: 'cams/sulphur_dioxide',
      legendTitle: 'SO₂ [ppb]',
      legendValueFormat: value => value * 1000000000,
      attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
    }],
    ['cams/nitrogen_dioxide_10m_above_ground', {
      imageBounds: [0.053e-9, 100e-9],
      colorBounds: [0.053e-9, 100e-9],
      colormap: 'cams/nitrogen_dioxide',
      legendTitle: 'NO₂ [ppb]',
      legendValueFormat: value => value * 1000000000,
      attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
    }],
    ['cams/particulate_matter_2p5um_10m_above_ground', {
      imageBounds: [0.012e-9, 35.4e-9],
      colorBounds: [0.012e-9, 35.4e-9],
      colormap: 'cams/particulate_matter_2p5um',
      legendTitle: 'PM2.5 [μg/m³]',
      legendValueFormat: value => value * 1000000000,
      attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
    }],
    ['cams/particulate_matter_10um_10m_above_ground', {
      imageBounds: [0.054e-9, 154e-9],
      colorBounds: [0.054e-9, 154e-9],
      colormap: 'cams/particulate_matter_10um',
      legendTitle: 'PM10 [μg/m³]',
      legendValueFormat: value => value * 1000000000,
      attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
    }],
    ['gfswave/waves', {
      imageBounds: [-20, 20],
      colorBounds: [0, 25],
      colormap: 'gfswave/waves',
      legendTitle: 'Peak Wave Period [s]',
      vector: true,
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_Wave_doc.shtml">NOAA GFS Wave</a>',
    }],
    ['gfswave/significant_wave_height', {
      imageBounds: [0, 15],
      colorBounds: [0, 15],
      colormap: 'gfswave/significant_wave_height',
      legendTitle: 'Significant Wave Height [m]',
      attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_Wave_doc.shtml">NOAA GFS Wave</a>',
    }],
    ['ostia_sst/analysed_sea_surface_temperature', {
      imageBounds: [270 - 273.15, 304.65 - 273.15],
      colorBounds: [270 - 273.15, 304.65 - 273.15],
      colormap: 'ostia_sst/analysed_sea_surface_temperature',
      legendTitle: 'Sea Surface Temperature [°C]',
      attribution: '<a href="https://resources.marine.copernicus.eu/?option=com_csw&view=details&product_id=SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001">Copernicus CMEMS OSTIA</a>',
    }],
    ['ostia_sst/sea_ice_fraction', {
      imageBounds: [0, 100],
      colorBounds: [0, 100],
      colormap: 'ostia_sst/sea_ice_fraction',
      legendTitle: 'Sea Ice Fraction [%]',
      attribution: '<a href="https://resources.marine.copernicus.eu/?option=com_csw&view=details&product_id=SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001">Copernicus CMEMS OSTIA</a>',
    }],
    ['ostia_anom/sea_surface_temperature_anomaly', {
      imageBounds: [-11, 11],
      colorBounds: [-11, 11],
      colormap: 'ostia_anom/sea_surface_temperature_anomaly',
      legendTitle: 'Sea Surface Temperature Anomaly [°C]',
      attribution: '<a href="https://resources.marine.copernicus.eu/?option=com_csw&view=details&product_id=SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001">Copernicus CMEMS OSTIA</a>',
    }],
    ['oscar/currents', {
      imageBounds: [-1, 1],
      colorBounds: [0, 1.5],
      colormap: 'oscar/currents',
      legendTitle: 'Currents [m/s]',
      legendValueDecimals: 1,
      vector: true,
      attribution: '<a href="https://www.esr.org/research/oscar/">ESR OSCAR</a>',
    }],
  ]);

  const particleConfigs = new Map([
    ['gfs/wind_10m_above_ground', {
      imageBounds: [-128, 127],
      maxAge: 25,     // 100,
      speedFactor: 2, // 33 / 100,
    }],
    ['gfswave/waves', {
      imageBounds: [-20, 20],
      maxAge: 25,       // 40,
      speedFactor: 0.2, // 33 / 612,
      width: 10,
    }],
    ['oscar/currents', {
      imageBounds: [-1, 1],
      maxAge: 25,       // 100,
      speedFactor: 0.2, // 33 / 7,
    }],
  ]);

  const datetimes = getDatetimes(datasets, DEFAULT_DATASET);

  const config = {
    staticConfig,
    rasterConfigs,
    particleConfigs,

    dataset: DEFAULT_DATASET,
    datetimes: datetimes,
    datetime: datetimes[datetimes.length - 1],
    rotate: false,

    outline: {
      enabled: false,
    },
    raster: {
      ...staticConfig.raster,
      ...rasterConfigs.get(DEFAULT_DATASET),
    },
    particle: {
      dataset: DEFAULT_DATASET,
      datetimes: datetimes,
      datetime: datetimes[datetimes.length - 1],
      ...staticConfig.particle,
      ...particleConfigs.get(DEFAULT_DATASET),
    },
  };

  return config;
}

function formatDatetime(datetime) {
  const formattedDatetime = `${datetime.substr(0, 4)}/${datetime.substr(4, 2)}/${datetime.substr(6, 2)} ${datetime.substr(8, 2)}:00 UTC`;
  return formattedDatetime;
}

function getDatetimeOptions(datetimes) {
  return datetimes.map(datetime => {
    const formattedDatetime = formatDatetime(datetime);
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

export function initGuiSimple(config, update, { datasets, globe } = {}) {
  const { staticConfig, rasterConfigs, particleConfigs } = config;

  const gui = new dat.GUI();
  gui.width = 300;

  gui.add(config, 'dataset', [...rasterConfigs.keys()]).onChange(async () => {
    // update datetime options
    config.datetimes = getDatetimes(datasets, config.dataset);
    updateGuiDatetimeOptions(gui, config, 'datetime', config.datetimes);
    if (!config.datetimes.includes(config.datetime)) {
      config.datetime = config.datetimes[config.datetimes.length - 1];
    }

    // update raster config
    const rasterConfig = { ...staticConfig.raster, ...rasterConfigs.get(config.dataset) };
    Object.keys(rasterConfig).forEach(key => {
      config.raster[key] = rasterConfig[key];
    });

    // update particle config
    config.particle.dataset = particleConfigs.has(config.dataset) ? config.dataset : 'none';
    config.particle.datetimes = getDatetimes(datasets, config.particle.dataset);
    config.particle.datetime = config.datetime;
    if (!config.particle.datetimes.includes(config.particle.datetime)) {
      config.particle.datetime = [...config.particle.datetimes].reverse().find(x => x <= config.datetime);
    }
    const particleConfig = { ...staticConfig.particle, ...particleConfigs.get(config.particle.dataset) };
    Object.keys(particleConfig).forEach(key => {
      config.particle[key] = particleConfig[key];
    });

    gui.updateDisplay();
    update();
  });

  gui.add(config, 'datetime', []).onChange(() => {
    config.particle.datetime = config.datetime;
    if (!config.particle.datetimes.includes(config.particle.datetime)) {
      config.particle.datetime = [...config.particle.datetimes].reverse().find(x => x <= config.datetime);
    }

    update();
  });
  updateGuiDatetimeOptions(gui, config, 'datetime', config.datetimes);

  if (globe) {
    gui.add(config, 'rotate').onChange(update);
  }

  gui.add({ 'Data': () => location.href = './data.html' }, 'Data');
  gui.add({ 'Layers': () => location.href = './layers.html' }, 'Layers');
  gui.add({ 'Examples': () => location.href = './examples.html' }, 'Examples');
  gui.add({ 'Roadmap': () => location.href = './roadmap.html' }, 'Roadmap');
  gui.add({ 'Contact': () => location.href = './contact.html' }, 'Contact');

  return gui;
}

export function initGui(config, update, { deckgl, datasets, globe } = {}) {
  const { staticConfig, particleConfigs } = config;

  const gui = initGuiSimple(config, update, { datasets, globe });

  const outline = gui.addFolder('Outline layer');
  outline.add(config.outline, 'enabled').onChange(update);
  outline.open();

  const raster = gui.addFolder('Raster layer');
  raster.add(config.raster, 'opacity', 0, 1, 0.01).onChange(update);
  raster.open();

  const particle = gui.addFolder('Particle layer');
  particle.add(config.particle, 'dataset', ['none', ...particleConfigs.keys()]).onChange(async () => {
    // update particle config
    config.particle.datetimes = getDatetimes(datasets, config.particle.dataset);
    config.particle.datetime = config.datetime;
    if (!config.particle.datetimes.includes(config.particle.datetime)) {
      config.particle.datetime = [...config.particle.datetimes].reverse().find(x => x <= config.datetime);
    }
    const particleConfig = { ...staticConfig.particle, ...particleConfigs.get(config.particle.dataset) };
    Object.keys(particleConfig).forEach(key => {
      config.particle[key] = particleConfig[key];
    });

    gui.updateDisplay();
    update();
  });
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