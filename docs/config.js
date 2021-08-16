export const NO_DATA = 'no data';

const DEFAULT_DATASET = 'gfs/wind_10m_above_ground';
const DEFAULT_COLORMAP = 'default';

export async function initConfig() {
  const stacCatalog = await WeatherLayers.loadStacCatalog();

  const config = {
    datasets: WeatherLayers.getStacCatalogCollectionIds(stacCatalog),
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
    config.datetimes = [];
    config.datetime = NO_DATA;
    config.datetime2 = NO_DATA;
    config.raster.enabled = false;
    config.particle.enabled = false;
    return;
  }

  const stacCollection = await WeatherLayers.loadStacCollection(config.dataset);

  config.datetimes = WeatherLayers.getStacCollectionItemDatetimes(stacCollection);
  config.datetime = WeatherLayers.getClosestDatetime(config.datetimes, config.datetime) || NO_DATA;
  config.datetime2 = NO_DATA;

  config.raster.enabled = !!stacCollection.summaries.raster;

  config.particle.enabled = !!stacCollection.summaries.particle;
  if (stacCollection.summaries.particle) {
    config.particle.maxAge = stacCollection.summaries.particle.maxAge;
    config.particle.speedFactor = stacCollection.summaries.particle.speedFactor;
    config.particle.width = stacCollection.summaries.particle.width;
  }
}

export function initGui(config, update, { deckgl, globe } = {}) {
  const gui = new dat.GUI();
  gui.width = 300;

  gui.add(config, 'dataset', [NO_DATA, ...config.datasets]).onChange(async () => {
    await updateDataset(config);
    updateGuiDatetimeOptions(gui, config, 'datetime', [NO_DATA, ...config.datetimes]);
    updateGuiDatetimeOptions(gui, config, 'datetime2', [NO_DATA, ...config.datetimes]);
    gui.updateDisplay();
    update();
  });

  gui.add(config, 'datetime', []).onChange(update);
  updateGuiDatetimeOptions(gui, config, 'datetime', [NO_DATA, ...config.datetimes]);
  gui.add(config, 'datetime2', []).onChange(update);
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
  particle.add({ step: () => deckgl.layerManager.getLayers({ layerIds: ['particle-line'] })[0]?.step() }, 'step');
  particle.add({ clear: () => deckgl.layerManager.getLayers({ layerIds: ['particle-line'] })[0]?.clear() }, 'clear');
  particle.open();

  return gui;
}