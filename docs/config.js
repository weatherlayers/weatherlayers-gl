const NO_DATA = 'no data';
const DEFAULT_DATASET = 'gfs/wind_10m_above_ground';
const DEFAULT_OUTLINE_DATASET = 'ne_110m_land';

function getDatetimes(datasets, datasetName) {
  const dataset = datasets.find(x => x.name === datasetName);
  if (!dataset) {
    return [];
  }

  const datetimes = dataset.datetimes;
  return datetimes;
}

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

export function initConfig({ datasets } = {}) {
  const staticConfig = {
    raster: {
      enabled: false,
      opacity: 0.2,
      imageBounds: null,
      colorBounds: null,
      colormap: NO_DATA,
      colormapUrl: null,
      legendWidth: 220,
      legendTitle: null,
      legendTicksCount: 6,
      legendValueFormat: null,
      vector: false,
      attribution: null,
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
        imageBounds: [-128, 127],
        colorBounds: [0, 100],
        colormap: 'gfs/wind',
        legendTitle: 'Wind [m/s]',
        vector: true,
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
      particle: {
        enabled: true,
        imageBounds: [-128, 127],
        maxAge: 25,     // 100,
        speedFactor: 2, // 33 / 100,
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    ['gfs/temperature_2m_above_ground', {
      raster: {
        enabled: true,
        imageBounds: [193 - 273.15, 328 - 273.15],
        colorBounds: [193 - 273.15, 328 - 273.15],
        colormap: 'gfs/temperature',
        legendTitle: 'Temperature [°C]',
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    ['gfs/relative_humidity_2m_above_ground', {
      raster: {
        enabled: true,
        imageBounds: [0, 100],
        colorBounds: [0, 100],
        colormap: 'gfs/relative_humidity',
        legendTitle: 'Relative Humidity [%]',
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    // ['gfs/accumulated_precipitation_surface', {
    //   raster: {
    //     enabled: true,
    //     imageBounds: [0, 150],
    //     colorBounds: [0, 150],
    //     colormap: 'gfs/accumulated_precipitation',
    //     legendTitle: 'Precipitation Accumulation [kg/m²]',
    //     attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
    //   },
    // }],
    ['gfs/accumulated_precipitation_next_3h_surface', {
      raster: {
        enabled: true,
        imageBounds: [0, 150],
        colorBounds: [0, 150],
        colormap: 'gfs/accumulated_precipitation',
        legendTitle: '3-hour Precipitation Accumulation [kg/m²]',
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    ['gfs/convective_available_potential_energy_surface', {
      raster: {
        enabled: true,
        imageBounds: [0, 5000],
        colorBounds: [0, 5000],
        colormap: 'gfs/convective_available_potential_energy',
        legendTitle: 'Convective Available Potential Energy [J/kg]',
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    ['gfs/precipitable_water_entire_atmosphere', {
      raster: {
        enabled: true,
        imageBounds: [0, 70],
        colorBounds: [0, 70],
        colormap: 'gfs/precipitable_water',
        legendTitle: 'Total Precipitable Water [kg/m²]',
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    ['gfs/cloud_water_entire_atmosphere', {
      raster: {
        enabled: true,
        imageBounds: [0, 1],
        colorBounds: [0, 1],
        colormap: 'gfs/cloud_water',
        legendTitle: 'Total Cloud Water [kg/m²]',
        legendValueDecimals: 1,
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    ['gfs/pressure_mean_sea_level', {
      raster: {
        enabled: true,
        imageBounds: [92000, 105000],
        colorBounds: [92000, 105000],
        colormap: 'gfs/pressure',
        legendTitle: 'Mean Sea Level Pressure [hPa]',
        legendValueFormat: value => value / 100,
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    ['gfs/apparent_temperature_2m_above_ground', {
      raster: {
        enabled: true,
        imageBounds: [236 - 273.15, 332 - 273.15],
        colorBounds: [236 - 273.15, 332 - 273.15],
        colormap: 'gfs/apparent_temperature',
        legendTitle: 'Apparent Temperature [°C]',
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    ['cams/carbon_monoxide_10m_above_ground', {
      raster: {
        enabled: true,
        imageBounds: [0.0044e-6, 9.4e-6],
        colorBounds: [0.0044e-6, 9.4e-6],
        colormap: 'cams/carbon_monoxide',
        legendTitle: 'CO [μg/m³]',
        legendValueFormat: value => value * 1000000000,
        attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
      },
    }],
    ['cams/sulphur_dioxide_10m_above_ground', {
      raster: {
        enabled: true,
        imageBounds: [0.035e-9, 75e-9],
        colorBounds: [0.035e-9, 75e-9],
        colormap: 'cams/sulphur_dioxide',
        legendTitle: 'SO₂ [ppb]',
        legendValueFormat: value => value * 1000000000,
        attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
      },
    }],
    ['cams/nitrogen_dioxide_10m_above_ground', {
      raster: {
        enabled: true,
        imageBounds: [0.053e-9, 100e-9],
        colorBounds: [0.053e-9, 100e-9],
        colormap: 'cams/nitrogen_dioxide',
        legendTitle: 'NO₂ [ppb]',
        legendValueFormat: value => value * 1000000000,
        attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
      },
    }],
    ['cams/particulate_matter_2p5um_10m_above_ground', {
      raster: {
        enabled: true,
        imageBounds: [0.012e-9, 35.4e-9],
        colorBounds: [0.012e-9, 35.4e-9],
        colormap: 'cams/particulate_matter_2p5um',
        legendTitle: 'PM2.5 [μg/m³]',
        legendValueFormat: value => value * 1000000000,
        attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
      },
    }],
    ['cams/particulate_matter_10um_10m_above_ground', {
      raster: {
        enabled: true,
        imageBounds: [0.054e-9, 154e-9],
        colorBounds: [0.054e-9, 154e-9],
        colormap: 'cams/particulate_matter_10um',
        legendTitle: 'PM10 [μg/m³]',
        legendValueFormat: value => value * 1000000000,
        attribution: '<a href="https://ads.atmosphere.copernicus.eu/cdsapp#!/dataset/cams-global-atmospheric-composition-forecasts">Copernicus CAMS</a>',
      },
    }],
    ['gfswave/waves', {
      raster: {
        enabled: true,
        imageBounds: [-20, 20],
        colorBounds: [0, 25],
        colormap: 'gfswave/waves',
        legendTitle: 'Peak Wave Period [s]',
        vector: true,
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_Wave_doc.shtml">NOAA GFS Wave</a>',
      },
      particle: {
        enabled: true,
        imageBounds: [-20, 20],
        maxAge: 25,       // 40,
        speedFactor: 0.2, // 33 / 612,
        width: 10,
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_Wave_doc.shtml">NOAA GFS Wave</a>',
      },
    }],
    ['gfswave/significant_wave_height', {
      raster: {
        enabled: true,
        imageBounds: [0, 15],
        colorBounds: [0, 15],
        colormap: 'gfswave/significant_wave_height',
        legendTitle: 'Significant Wave Height [m]',
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_Wave_doc.shtml">NOAA GFS Wave</a>',
      },
    }],
    ['ostia_sst/analysed_sea_surface_temperature', {
      raster: {
        enabled: true,
        imageBounds: [270 - 273.15, 304.65 - 273.15],
        colorBounds: [270 - 273.15, 304.65 - 273.15],
        colormap: 'ostia_sst/analysed_sea_surface_temperature',
        legendTitle: 'Sea Surface Temperature [°C]',
        attribution: '<a href="https://resources.marine.copernicus.eu/?option=com_csw&view=details&product_id=SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001">Copernicus CMEMS OSTIA</a>',
      },
    }],
    ['ostia_sst/sea_ice_fraction', {
      raster: {
        enabled: true,
        imageBounds: [0, 100],
        colorBounds: [0, 100],
        colormap: 'ostia_sst/sea_ice_fraction',
        legendTitle: 'Sea Ice Fraction [%]',
        attribution: '<a href="https://resources.marine.copernicus.eu/?option=com_csw&view=details&product_id=SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001">Copernicus CMEMS OSTIA</a>',
      },
    }],
    ['ostia_anom/sea_surface_temperature_anomaly', {
      raster: {
        enabled: true,
        imageBounds: [-11, 11],
        colorBounds: [-11, 11],
        colormap: 'ostia_anom/sea_surface_temperature_anomaly',
        legendTitle: 'Sea Surface Temperature Anomaly [°C]',
        attribution: '<a href="https://resources.marine.copernicus.eu/?option=com_csw&view=details&product_id=SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001">Copernicus CMEMS OSTIA</a>',
      },
    }],
    ['oscar/currents', {
      raster: {
        enabled: true,
        imageBounds: [-1, 1],
        colorBounds: [0, 1.5],
        colormap: 'oscar/currents',
        legendTitle: 'Currents [m/s]',
        legendValueDecimals: 1,
        vector: true,
        attribution: '<a href="https://www.esr.org/research/oscar/">ESR OSCAR</a>',
      },
      particle: {
        enabled: true,
        imageBounds: [-1, 1],
        maxAge: 25,       // 100,
        speedFactor: 0.2, // 33 / 7,
        attribution: '<a href="https://www.esr.org/research/oscar/">ESR OSCAR</a>',
      },
    }],
  ]);

  const colormapConfigs = new Map([
    ['gfs/wind', 'https://weather-config.kamzek.com/colormaps/gfs/wind.png'],
    ['gfs/temperature', 'https://weather-config.kamzek.com/colormaps/gfs/temperature.png'],
    ['gfs/relative_humidity', 'https://weather-config.kamzek.com/colormaps/gfs/relative_humidity.png'],
    ['gfs/accumulated_precipitation', 'https://weather-config.kamzek.com/colormaps/gfs/accumulated_precipitation.png'],
    ['gfs/accumulated_precipitation', 'https://weather-config.kamzek.com/colormaps/gfs/accumulated_precipitation.png'],
    ['gfs/convective_available_potential_energy', 'https://weather-config.kamzek.com/colormaps/gfs/convective_available_potential_energy.png'],
    ['gfs/precipitable_water', 'https://weather-config.kamzek.com/colormaps/gfs/precipitable_water.png'],
    ['gfs/cloud_water', 'https://weather-config.kamzek.com/colormaps/gfs/cloud_water.png'],
    ['gfs/pressure', 'https://weather-config.kamzek.com/colormaps/gfs/pressure.png'],
    ['gfs/apparent_temperature', 'https://weather-config.kamzek.com/colormaps/gfs/apparent_temperature.png'],
    ['cams/carbon_monoxide', 'https://weather-config.kamzek.com/colormaps/cams/carbon_monoxide.png'],
    ['cams/sulphur_dioxide', 'https://weather-config.kamzek.com/colormaps/cams/sulphur_dioxide.png'],
    ['cams/nitrogen_dioxide', 'https://weather-config.kamzek.com/colormaps/cams/nitrogen_dioxide.png'],
    ['cams/particulate_matter_2p5um', 'https://weather-config.kamzek.com/colormaps/cams/particulate_matter_2p5um.png'],
    ['cams/particulate_matter_10um', 'https://weather-config.kamzek.com/colormaps/cams/particulate_matter_10um.png'],
    ['gfswave/waves', 'https://weather-config.kamzek.com/colormaps/gfswave/waves.png'],
    ['gfswave/significant_wave_height', 'https://weather-config.kamzek.com/colormaps/gfswave/significant_wave_height.png'],
    ['ostia_sst/analysed_sea_surface_temperature', 'https://weather-config.kamzek.com/colormaps/ostia_sst/analysed_sea_surface_temperature.png'],
    ['ostia_sst/sea_ice_fraction', 'https://weather-config.kamzek.com/colormaps/ostia_sst/sea_ice_fraction.png'],
    ['ostia_anom/sea_surface_temperature_anomaly', 'https://weather-config.kamzek.com/colormaps/ostia_anom/sea_surface_temperature_anomaly.png'],
    ['oscar/currents', 'https://weather-config.kamzek.com/colormaps/oscar/currents.png'],
    ['BrBG', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/BrBG.png'],
    ['PRGn', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PRGn.png'],
    ['PiYG', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PiYG.png'],
    ['PuOr', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PuOr.png'],
    ['RdBu', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdBu.png'],
    ['RdGy', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdGy.png'],
    ['RdYlBu', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdYlBu.png'],
    ['RdYlGn', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdYlGn.png'],
    ['Spectral', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Spectral.png'],
    ['Blues', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Blues.png'],
    ['Greens', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Greens.png'],
    ['Greys', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Greys.png'],
    ['Oranges', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Oranges.png'],
    ['Purples', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Purples.png'],
    ['Reds', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Reds.png'],
    ['turbo', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/turbo.png'],
    ['viridis', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/viridis.png'],
    ['inferno', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/inferno.png'],
    ['magma', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/magma.png'],
    ['plasma', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/plasma.png'],
    ['cividis', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/cividis.png'],
    ['warm', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/warm.png'],
    ['cool', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/cool.png'],
    ['cubehelix', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/cubehelix.png'],
    ['BuGn', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/BuGn.png'],
    ['BuPu', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/BuPu.png'],
    ['GnBu', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/GnBu.png'],
    ['OrRd', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/OrRd.png'],
    ['PuBuGn', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PuBuGn.png'],
    ['PuBu', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PuBu.png'],
    ['PuRd', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/PuRd.png'],
    ['RdPu', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdPu.png'],
    ['YlGnBu', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/YlGnBu.png'],
    ['YlGn', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/YlGn.png'],
    ['YlOrBr', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/YlOrBr.png'],
    ['YlOrRd', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/YlOrRd.png'],
    ['rainbow', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/rainbow.png'],
    ['sinebow', 'https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/sinebow.png'],
  ]);

  const outlineConfigs = new Map([
    ['ne_110m_land', {
      datasetUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson',
      attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>',
    }],
    ['ne_50m_land', {
      datasetUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson',
      attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>',
    }],
    ['ne_110m_admin_0_countries', {
      datasetUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson',
      attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>',
    }],
    ['ne_50m_admin_0_countries', {
      datasetUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson',
      attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>',
    }],
  ]);

  const datetimes = getDatetimes(datasets, DEFAULT_DATASET);

  const config = {
    staticConfig,
    datasetConfigs,
    colormapConfigs,
    outlineConfigs,

    datasets,
    dataset: DEFAULT_DATASET,
    datetimes: datetimes,
    datetime: datetimes[datetimes.length - 1],
    datetime2: NO_DATA,
    datetimeWeight: 0,
    rotate: false,

    raster: {
      ...staticConfig.raster,
      ...datasetConfigs.get(DEFAULT_DATASET).raster,
      colormapUrl: colormapConfigs.get(datasetConfigs.get(DEFAULT_DATASET).raster.colormap),
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

function formatDatetime(datetime) {
  if (!datetime.match(/^\d+$/)) {
    return datetime;
  }

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

function updatePresetDataset(config) {
  const { staticConfig, datasetConfigs, colormapConfigs } = config;

  config.datetimes = getDatetimes(config.datasets, config.dataset);
  config.datetime = getDatetime(config.datetimes, config.datetime);

  const rasterConfig = { ...staticConfig.raster, ...datasetConfigs.get(config.dataset)?.raster };
  Object.keys(rasterConfig).forEach(key => {
    config.raster[key] = rasterConfig[key];
  });

  const colormapUrl = colormapConfigs.get(config.raster.colormap);
  config.raster.colormapUrl = colormapUrl;

  const particleConfig = { ...staticConfig.particle, ...datasetConfigs.get(config.dataset)?.particle };
  Object.keys(particleConfig).forEach(key => {
    config.particle[key] = particleConfig[key];
  });
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

  const colormapUrl = colormapConfigs.get(config.raster.colormap);
  config.raster.colormapUrl = colormapUrl;
}

export function initGui(config, update, { deckgl, globe } = {}) {
  const { outlineConfigs, colormapConfigs, datasetConfigs } = config;

  const gui = new dat.GUI();
  gui.width = 300;

  gui.add(config, 'dataset', [NO_DATA, ...datasetConfigs.keys()]).onChange(async () => {
    updatePresetDataset(config);
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
  raster.add(config.raster, 'colormap', [NO_DATA, ...colormapConfigs.keys()]).onChange(() => {
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