export const NO_DATA = 'no data';

const DEFAULT_DATASET = 'gfs/wind_10m_above_ground';
const DEFAULT_COLORMAP = 'default';

export async function initConfig() {
  const client = WeatherLayers.getClient();

  const stacCatalog = await client.loadStacCatalog();

  const config = {
    client,
    datasets: client.getStacCatalogCollectionIds(stacCatalog),
    dataset: DEFAULT_DATASET,
    datetimes: [],
    datetime: new Date().toISOString(),
    datetimeInterpolate: true,
    rotate: false,

    raster: {
      enabled: false,
      opacity: 0.2,
      colormap: DEFAULT_COLORMAP,
    },
    contour: {
      enabled: false,
      delta: 200,
      color: { r: 255, g: 255, b: 255 },
      width: 1,
      opacity: 0.01
    },
    highLow: {
      enabled: false,
      radius: 2000,
      color: { r: 153, g: 153, b: 153 },
      outlineColor: { r: 13, g: 13, b: 13 },
      opacity: 1,
    },
    particle: {
      enabled: false,
      numParticles: 5000,
      maxAge: 25,
      speedFactor: 2,
      color: { r: 255, g: 255, b: 255 },
      width: 2,
      opacity: 0.02,
      animate: true,
    },
  };

  await updateDataset(config);

  return config;
}

function getOptions(options) {
  return options.map(x => ({ value: x, text: x }));
}

function getDatetimeOptions(datetimes) {
  return datetimes.map(x => ({ value: x, text: WeatherLayers.formatDatetime(x) }));
}

async function updateDataset(config) {
  if (config.dataset === NO_DATA) {
    config.datetimes = [];
    config.datetime = NO_DATA;
    config.raster.enabled = false;
    config.contour.enabled = false;
    config.highLow.enabled = false;
    config.particle.enabled = false;
    return;
  }

  const client = config.client;
  const stacCollection = await client.loadStacCollection(config.dataset);

  config.datetimes = client.getStacCollectionDatetimes(stacCollection);
  config.datetime = client.getStacCollectionClosestStartDatetime(stacCollection, config.datetime) || config.datetimes[0];

  config.raster.enabled = !!stacCollection.summaries.raster;

  config.contour.enabled = !!stacCollection.summaries.contour;
  if (stacCollection.summaries.contour) {
    config.contour.delta = stacCollection.summaries.contour.delta;
  }

  config.highLow.enabled = !!stacCollection.summaries.highLow;
  if (stacCollection.summaries.highLow) {
    config.highLow.radius = stacCollection.summaries.highLow.radius;
  }

  config.particle.enabled = !!stacCollection.summaries.particle;
  if (stacCollection.summaries.particle) {
    config.particle.maxAge = stacCollection.summaries.particle.maxAge;
    config.particle.speedFactor = stacCollection.summaries.particle.speedFactor;
    config.particle.width = stacCollection.summaries.particle.width;
  }
}

export function initGui(config, update, { deckgl, globe } = {}) {
  const updateLast = event => event.last && update();

  const gui = new Tweakpane.Pane();

  let datetime;
  gui.addInput(config, 'dataset', { options: getOptions([NO_DATA, ...config.datasets]) }).on('change', async () => {
    await updateDataset(config);
    datetime.dispose();
    datetime = gui.addInput(config, 'datetime', { options: getDatetimeOptions([NO_DATA, ...config.datetimes]), index: 1 }).on('change', update);
    update();
  });

  datetime = gui.addInput(config, 'datetime', { options: getDatetimeOptions([NO_DATA, ...config.datetimes]) }).on('change', update);

  if (deckgl) {
    gui.addInput(config, 'datetimeInterpolate').on('change', update);
  }

  if (globe) {
    gui.addInput(config, 'rotate').on('change', update);
  }

  gui.addButton({ title: 'Docs' }).on('click', () => location.href = 'http://docs.weatherlayers.com/');

  const raster = gui.addFolder({ title: 'Raster layer', expanded: true });
  raster.addInput(config.raster, 'enabled').on('change', update);
  raster.addInput(config.raster, 'colormap', { options: getOptions([DEFAULT_COLORMAP]) }); // dummy
  raster.addInput(config.raster, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

  if (deckgl) {
    const contour = gui.addFolder({ title: 'Contour layer', expanded: true });
    contour.addInput(config.contour, 'enabled').on('change', update);
    contour.addInput(config.contour, 'delta', { min: 0, max: 1000, step: 1 }).on('change', updateLast);
    contour.addInput(config.contour, 'color').on('change', update);
    contour.addInput(config.contour, 'width', { min: 0.5, max: 10, step: 0.5 }).on('change', update);
    contour.addInput(config.contour, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

    const highLow = gui.addFolder({ title: 'HighLow layer', expanded: true });
    highLow.addInput(config.highLow, 'enabled').on('change', update);
    highLow.addInput(config.highLow, 'radius', { min: 0, max: 5 * 1000, step: 1 }).on('change', updateLast);
    highLow.addInput(config.highLow, 'color').on('change', update);
    highLow.addInput(config.highLow, 'outlineColor').on('change', update);
    highLow.addInput(config.highLow, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);

    const particle = gui.addFolder({ title: 'Particle layer', expanded: true });
    particle.addInput(config.particle, 'enabled').on('change', update);
    particle.addInput(config.particle, 'numParticles', { min: 0, max: 100000, step: 1 }).on('change', updateLast);
    particle.addInput(config.particle, 'maxAge', { min: 1, max: 255, step: 1 }).on('change', updateLast);
    particle.addInput(config.particle, 'speedFactor', { min: 0.1, max: 20, step: 0.1 }).on('change', update); // 0.05, 5, 0.01
    particle.addInput(config.particle, 'color').on('change', update);
    particle.addInput(config.particle, 'width', { min: 0.5, max: 10, step: 0.5 }).on('change', update);
    particle.addInput(config.particle, 'opacity', { min: 0, max: 1, step: 0.01 }).on('change', update);
    particle.addInput(config.particle, 'animate').on('change', update);
    particle.addButton({ title: 'Step' }).on('click', () => deckgl.layerManager.getLayers({ layerIds: ['particle-line'] })[0]?.step());
    particle.addButton({ title: 'Clear' }).on('click', () => deckgl.layerManager.getLayers({ layerIds: ['particle-line'] })[0]?.clear());
  }

  return gui;
}

export function colorToArray(color) {
  return [color.r, color.g, color.b, ...(typeof color.a === 'number' ? [color.a * 255] : [])];
}