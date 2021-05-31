const DEFAULT_DATASET = 'gfs/wind';

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
      opacity: 0.3,
      imageBounds: null,
      colorBounds: null,
      legendWidth: 220,
      legendTitle: null,
      legendTicksCount: 6,
      legendValueFormat: null,
      vector: false,
    },
    particle: {
      numParticles: 5000,
      maxAge: 30,
      speedFactor: 10,
      color: [255, 255, 255],
      opacity: 0.01,
      width: 2,
      animate: true,
    },
  };

  const rasterConfigs = new Map([
    ['gfs/wind', {
      imageBounds: [-128, 127],
      colorBounds: [0, 100],
      legendTitle: 'Wind [m/s]',
      vector: true,
    }],
    ['gfs/tmp', {
      imageBounds: [193 - 273.15, 328 - 273.15],
      colorBounds: [193 - 273.15, 328 - 273.15],
      legendTitle: 'Temperature [°C]',
    }],
    ['gfs/rh', {
      imageBounds: [0, 100],
      colorBounds: [0, 100],
      legendTitle: 'Relative Humidity [%]',
    }],
    // ['gfs/apcp', {
    //   imageBounds: [0, 150],
    //   colorBounds: [0, 150],
    //   legendTitle: 'Precipitation Accumulation [kg/m²]',
    // }],
    ['gfs/apcp_3h', {
      imageBounds: [0, 150],
      colorBounds: [0, 150],
      legendTitle: '3-hour Precipitation Accumulation [kg/m²]',
    }],
    ['gfs/cape', {
      imageBounds: [0, 5000],
      colorBounds: [0, 5000],
      legendTitle: 'Convective Available Potential Energy [J/kg]',
    }],
    ['gfs/pwat', {
      imageBounds: [0, 70],
      colorBounds: [0, 70],
      legendTitle: 'Total Precipitable Water [kg/m²]',
    }],
    ['gfs/cwat', {
      imageBounds: [0, 1],
      colorBounds: [0, 1],
      legendTitle: 'Total Cloud Water [kg/m²]',
      legendValueDecimals: 1,
    }],
    ['gfs/prmsl', {
      imageBounds: [92000, 105000],
      colorBounds: [92000, 105000],
      legendTitle: 'Mean Sea Level Pressure [hPa]',
      legendValueFormat: value => value / 100,
    }],
    ['gfs/aptmp', {
      imageBounds: [236 - 273.15, 332 - 273.15],
      colorBounds: [236 - 273.15, 332 - 273.15],
      legendTitle: 'Misery (Wind Chill & Heat Index) [°C]',
    }],
    ['gfswave/waves', {
      imageBounds: [-20, 20],
      colorBounds: [0, 25],
      legendTitle: 'Peak Wave Period [s]',
      vector: true,
    }],
    ['gfswave/htsgw', {
      imageBounds: [0, 15],
      colorBounds: [0, 15],
      legendTitle: 'Significant Wave Height [m]',
    }],
    ['cams/co', {
      imageBounds: [0.0044e-6, 9.4e-6],
      colorBounds: [0.0044e-6, 9.4e-6],
      legendTitle: 'CO [μg/m³]',
      legendValueFormat: value => value * 1000000000,
    }],
    ['cams/so2', {
      imageBounds: [0.035e-9, 75e-9],
      colorBounds: [0.035e-9, 75e-9],
      legendTitle: 'SO₂ [ppb]',
      legendValueFormat: value => value * 1000000000,
    }],
    ['cams/no2', {
      imageBounds: [0.053e-9, 100e-9],
      colorBounds: [0.053e-9, 100e-9],
      legendTitle: 'NO₂ [ppb]',
      legendValueFormat: value => value * 1000000000,
    }],
    ['cams/pm2p5', {
      imageBounds: [0.012e-9, 35.4e-9],
      colorBounds: [0.012e-9, 35.4e-9],
      legendTitle: 'PM2.5 [μg/m³]',
      legendValueFormat: value => value * 1000000000,
    }],
    ['cams/pm10', {
      imageBounds: [0.054e-9, 154e-9],
      colorBounds: [0.054e-9, 154e-9],
      legendTitle: 'PM10 [μg/m³]',
      legendValueFormat: value => value * 1000000000,
    }],
    ['ostia_sst/analysed_sst', {
      imageBounds: [270 - 273.15, 304.65 - 273.15],
      colorBounds: [270 - 273.15, 304.65 - 273.15],
      legendTitle: 'Sea Surface Temperature [°C]',
    }],
    ['ostia_sst/sea_ice_fraction', {
      imageBounds: [0, 100],
      colorBounds: [0, 100],
      legendTitle: 'Sea Ice Fraction [%]',
    }],
    ['ostia_anom/sst_anomaly', {
      imageBounds: [-11, 11],
      colorBounds: [-11, 11],
      legendTitle: 'Sea Surface Temperature Anomaly [°C]',
    }],
    ['oscar/currents', {
      imageBounds: [-1, 1],
      colorBounds: [0, 1.5],
      legendTitle: 'Currents [m/s]',
      legendValueDecimals: 1,
      vector: true,
    }],
  ]);

  const particleConfigs = new Map([
    ['gfs/wind', {
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

  gui.add({ 'Documentation': () => location.href = './docs.html' }, 'Documentation');

  return gui;
}

export function initGui(config, update, { deckgl, datasets, globe } = {}) {
  const { staticConfig, particleConfigs } = config;

  const gui = initGuiSimple(config, update, { datasets, globe });

  const raster = gui.addFolder('RasterLayer');
  raster.add(config.raster, 'opacity', 0, 1, 0.01).onChange(update);
  raster.open();

  const particle = gui.addFolder('ParticleLayer');
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