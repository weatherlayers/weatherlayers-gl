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
      colormapBreaks: null,
      legendWidth: 220,
      legendTitle: null,
      legendTicksCount: 6,
      legendValueFormatter: null,
      legendValueDecimals: 0,
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
        imageBounds: [193, 328],
        colorBounds: [193, 328],
        colormap: 'gfs/temperature',
        legendTitle: 'Temperature [°C]',
        legendValueFormatter: value => value - 273.15,
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
        legendValueFormatter: value => value / 100,
        attribution: '<a href="https://nomads.ncep.noaa.gov/txt_descriptions/GFS_doc.shtml">NOAA GFS</a>',
      },
    }],
    ['gfs/apparent_temperature_2m_above_ground', {
      raster: {
        enabled: true,
        imageBounds: [236, 332],
        colorBounds: [236, 332],
        colormap: 'gfs/apparent_temperature',
        legendTitle: 'Apparent Temperature [°C]',
        legendValueFormatter: value => value - 273.15,
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
        legendValueFormatter: value => value * 1000000000,
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
        legendValueFormatter: value => value * 1000000000,
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
        legendValueFormatter: value => value * 1000000000,
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
        legendValueFormatter: value => value * 1000000000,
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
        legendValueFormatter: value => value * 1000000000,
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
        imageBounds: [270, 304.65],
        colorBounds: [270, 304.65],
        colormap: 'ostia_sst/analysed_sea_surface_temperature',
        legendTitle: 'Sea Surface Temperature [°C]',
        legendValueFormatter: value => value - 273.15,
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
    ['gfs/wind', {
      colormapUrl: 'https://config.weatherlayers.com/colormaps/gfs/wind.png',
    }],
    ['gfs/temperature', {
      colormapBreaks: [
        [193,     [37, 4, 42]],
        [206,     [41, 10, 130]],
        [219,     [81, 40, 40]],
        [233.15,  [192, 37, 149]], // -40 C/F
        [255.372, [70, 215, 215]], // 0 F
        [273.15,  [21, 84, 187]],  // 0 C
        [275.15,  [24, 132, 14]],  // just above 0 C
        [291,     [247, 251, 59]],
        [298,     [235, 167, 21]],
        [311,     [230, 71, 39]],
        [328,     [88, 27, 67]],
      ],
    }],
    ['gfs/relative_humidity', {
      colormapBreaks: [
        [0,   [230, 165, 30]],
        [25,  [120, 100, 95]],
        [60,  [40, 44, 92]],
        [75,  [21, 13, 193]],
        [90,  [75, 63, 235]],
        [100, [25, 255, 255]],
      ],
    }],
    ['gfs/accumulated_precipitation', {
      colormapBreaks: [
        [0,   [37, 79, 92]],
        [2,   [240, 248, 255]],
        [15,  [51, 26, 155]],
        [50,  [230, 0, 116]],
        [100, [255, 215, 0]],
        [150, [255, 215, 0]],
      ],
    }],
    ['gfs/convective_available_potential_energy', {
      colormapBreaks: [
        [0,    [5, 48, 97]],     // weak
        [500,  [33, 102, 172]],  // weak
        [1000, [67, 147, 195]],  // weak
        [1500, [146, 197, 222]], // moderate
        [2000, [209, 229, 240]], // moderate
        [2500, [247, 247, 247]], // moderate
        [3000, [253, 219, 199]], // strong
        [3500, [244, 165, 130]], // strong
        [4000, [214, 96, 77]],   // strong
        [4500, [178, 24, 43]],   // extreme
        [5000, [103, 0, 31]],    // extreme
      ],
    }],
    ['gfs/precipitable_water', {
      colormapBreaks: [
        [0,  [230, 165, 30]],
        [10, [120, 100, 95]],
        [20, [40, 44, 92]],
        [30, [21, 13, 193]],
        [40, [75, 63, 235]],
        [60, [25, 255, 255]],
        [70, [150, 255, 255]],
      ],
    }],
    ['gfs/cloud_water', {
      colormapBreaks: [
        [0.0, [5, 5, 89]],
        [0.2, [170, 170, 230]],
        [1.0, [255, 255, 255]],
      ],
    }],
    ['gfs/pressure', {
      colormapBreaks: [
        [92000,  [40, 0, 0]],
        [95000,  [187, 60, 31]],
        [96500,  [137, 32, 30]],
        [98000,  [16, 1, 43]],
        [100500, [36, 1, 93]],
        [101300, [241, 254, 18]],
        [103000, [228, 246, 223]],
        [105000, [255, 255, 255]],
      ],
    }],
    ['gfs/apparent_temperature', {
      colormapBreaks: [
        [236,   [255, 255, 255]],
        [241,   [255, 255, 255]], // -32 C, -25 F extreme frostbite
        [245.5, [6, 82, 255]],
        [250,   [6, 82, 255]],    // -23 C, -10 F frostbite
        [258,   [46, 131, 255]],
        [266,   [46, 131, 255]],  // -7 C, 20 F hypothermia
        [280,   [0, 0, 0]],       // 7 C, 45 F begin suckage [cold)
        [300,   [0, 0, 0]],       // 27 C, 80 F begin caution [heat)
        [305,   [247, 20, 35]],   // 32 C, 90 F extreme caution
        [309.5, [247, 20, 35]],
        [314,   [245, 210, 5]],   // 41 C, 105 F danger
        [320.5, [245, 210, 5]],
        [327,   [255, 255, 255]], // 54 C, 130 F extreme danger
        [332,   [255, 255, 255]],
      ],
    }],
    ['cams/carbon_monoxide', {
      colormapBreaks: [
        [0.0044e-6, '#c6bc7300'],
        [0.44e-6,   '#c6bc73'],
        [4.4e-6,    '#e4672a'],
        [9.4e-6,    '#4b0c00'],
      ],
    }],
    ['cams/sulphur_dioxide', {
      colormapBreaks: [
        [0.035e-9, '#c6bc7300'],
        [3.5e-9,   '#c6bc73'],
        [35e-9,    '#e4672a'],
        [75e-9,    '#4b0c00'],
      ],
    }],
    ['cams/nitrogen_dioxide', {
      colormapBreaks: [
        [0.053e-9, '#c6bc7300'],
        [5.3e-9,   '#c6bc73'],
        [53e-9,    '#e4672a'],
        [100e-9,   '#4b0c00'],
      ],
    }],
    ['cams/particulate_matter_2p5um', {
      colormapBreaks: [
        [0.012e-9, '#c6bc7300'],
        [1.2e-9,   '#c6bc73'],
        [12e-9,    '#e4672a'],
        [35.4e-9,  '#4b0c00'],
      ],
    }],
    ['cams/particulate_matter_10um', {
      colormapBreaks: [
        [0.054e-9, '#c6bc7300'],
        [5.4e-9,   '#c6bc73'],
        [54e-9,    '#e4672a'],
        [154e-9,   '#4b0c00'],
      ],
    }],
    ['gfswave/waves', {
      colormapBreaks: [
        [0,  [0, 0, 0]],
        [25, [21, 255, 255]],
      ],
    }],
    ['gfswave/significant_wave_height', {
      colormapBreaks: [
        [0,  [8, 29, 88]],
        [1,  [37, 52, 148]],
        [2,  [34, 94, 168]],
        [3,  [29, 145, 192]],
        [4,  [65, 182, 196]],
        [5,  [127, 205, 187]],
        [6,  [199, 233, 180]],
        [7,  [237, 248, 177]],
        [8,  [254, 204, 92]],
        [10, [253, 141, 60]],
        [12, [240, 59, 32]],
        [14, [189, 0, 38]],
        [15, [189, 0, 38]],
      ],
    }],
    ['ostia_sst/analysed_sea_surface_temperature', {
      colormapBreaks: [
        [270,    [255, 255, 255]],
        [271.25, [255, 255, 255]], // -1.9 C sea water freeze
        [271.30, [15, 4, 168]],
        [273.15, [15, 54, 208]],   // 0 C fresh water freeze
        [273.25, [15, 54, 188]],
        [275.65, [15, 4, 168]],    // lower boundary for cool currents
        [281.65, [24, 132, 14]],   // upper boundary for cool currents
        [291.15, [247, 251, 59]],  // lower boundary for warm currents
        [295,    [235, 167, 0]],
        [299.65, [245, 0, 39]],    // minimum needed for tropical cyclone formation
        [303,    [87, 17, 0]],
        [304.65, [238, 0, 242]],
      ],
    }],
    ['ostia_sst/sea_ice_fraction', {
      colormapBreaks: [
        // https://archimer.ifremer.fr/doc/00448/55980/57458.pdf
        [0,   [0, 0, 0]],
        [5,   [3, 5, 18]],
        [10,  [20, 20, 43]],
        [15,  [34, 33, 68]],
        [20,  [40, 47, 96]],
        [25,  [59, 59, 124]],
        [30,  [63, 74, 150]],
        [35,  [62, 93, 169]],
        [40,  [63, 113, 180]],
        [45,  [71, 132, 186]],
        [50,  [82, 149, 192]],
        [55,  [93, 166, 200]],
        [60,  [117, 186, 206]],
        [65,  [138, 204, 215]],
        [70,  [170, 218, 224]],
        [75,  [204, 234, 237]],
        [80,  [233, 251, 252]],
        [100, [255, 255, 255]],
      ],
    }],
    ['ostia_anom/sea_surface_temperature_anomaly', {
      colormapBreaks: [
        [-11,   [255, 255, 255]],
        [-3,    [7, 252, 254]],
        [-1.5,  [66, 42, 253]],
        [-0.75, [34, 55, 134]],
        [0,     [0, 0, 6]],
        [0.75,  [134, 55, 34]],
        [1.5,   [253, 14, 16]],
        [3.0,   [254, 252, 0]],
        [11.0,  [255, 255, 255]],
      ],
    }],
    ['oscar/currents', {
      colormapBreaks: [
        [0,    [10, 25, 68]],
        [0.15, [10, 25, 250]],
        [0.4,  [24, 255, 93]],
        [0.65, [255, 233, 102]],
        [1.0,  [255, 233, 15]],
        [1.5,  [255, 15, 15]],
      ],
    }],
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

  const colormapConfig = { colormapUrl: undefined, colormapBreaks: undefined, ...colormapConfigs.get(config.raster.colormap) };
  Object.keys(colormapConfig).forEach(key => {
    config.raster[key] = colormapConfig[key];
  });

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

  const colormapConfig = { colormapUrl: undefined, colormapBreaks: undefined, ...colormapConfigs.get(config.raster.colormap) };
  Object.keys(colormapConfig).forEach(key => {
    config.raster[key] = colormapConfig[key];
  });
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