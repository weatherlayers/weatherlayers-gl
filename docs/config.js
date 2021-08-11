export const STAC_CATALOG_URL = 'https://api.weatherlayers.com/catalog';
export const STAC_CATALOG_ACCESS_TOKEN = '9djqrhlmAjv2Mv2z2Vwz'; // kamzek-weather token
export const STAC_ASSET_ID = 'byte.png';
export const NO_DATA = 'no data';

const DEFAULT_DATASET = 'gfs/wind_10m_above_ground';
const DEFAULT_COLORMAP = 'default';

export async function initConfig() {
  const stacCatalog = await WeatherLayers.loadStacCatalog(STAC_CATALOG_URL, STAC_CATALOG_ACCESS_TOKEN);

  const config = {
    stacCatalog,
    stacCollection: null,
    stacItem: null,
    stacItem2: null,
    dataset: DEFAULT_DATASET,
    datetimes: [],
    datetime: NO_DATA,
    datetime2: NO_DATA,
    datetimeWeight: 0,
    rotate: false,

    raster: {
      enabled: false,
      opacity: 0.2,
      colormap: DEFAULT_COLORMAP,
      colormapBreaks: null,
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

  await updateDataset(config);

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
  if (config.dataset === NO_DATA) {
    config.stacCollection = null;
    config.datetimes = [];
    config.datetime = NO_DATA;
    config.datetime2 = NO_DATA;
    config.stacItem = null;
    config.stacItem2 = null;
    config.raster.enabled = false;
    config.particle.enabled = false;
    return;
  }

  config.stacCollection = await WeatherLayers.loadStacCollection(config.stacCatalog, config.dataset);
  config.datetimes = WeatherLayers.getStacCollectionDatetimes(config.stacCollection);
  config.datetime = WeatherLayers.getClosestDatetime(config.datetimes, config.datetime) || NO_DATA;
  config.datetime2 = NO_DATA;
  config.stacItem = config.datetime && await WeatherLayers.loadStacItemByDatetime(config.stacCollection, config.datetime);
  config.stacItem2 = null;

  config.raster.enabled = !!config.stacCollection.summaries.raster;
  if (config.stacCollection.summaries.raster) {
    config.raster.colormapBreaks = config.stacCollection.summaries.raster.colormapBreaks;
  }

  config.particle.enabled = !!config.stacCollection.summaries.particle;
  if (config.stacCollection.summaries.particle) {
    config.particle.maxAge = config.stacCollection.summaries.particle.maxAge;
    config.particle.speedFactor = config.stacCollection.summaries.particle.speedFactor;
    config.particle.width = config.stacCollection.summaries.particle.width;
  }
}

async function updateDatetime(config) {
  if (config.datetime === NO_DATA) {
    config.stacItem = null;
    return;
  }

  config.stacItem = await WeatherLayers.loadStacItemByDatetime(config.stacCollection, config.datetime);
}

async function updateDatetime2(config) {
  if (config.datetime2 === NO_DATA) {
    config.stacItem2 = null;
    return;
  }

  config.stacItem2 = await WeatherLayers.loadStacItemByDatetime(config.stacCollection, config.datetime2);
}

export function initGui(config, update, { deckgl, globe } = {}) {
  const { stacCatalog } = config;

  const gui = new dat.GUI();
  gui.width = 300;

  gui.add(config, 'dataset', [NO_DATA, ...WeatherLayers.getStacCatalogCollectionIds(stacCatalog)]).onChange(async () => {
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
  raster.add(config.raster, 'colormap', [DEFAULT_COLORMAP]); // dummy
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

  return gui;
}