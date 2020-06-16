export const config = {
    source: {
        imagePath: '../data/gfs/wind/2020061500.png',
        bounds: [[-128, -128], [127, 127]],
    },
    particles: {
        count: 1024,
        size: 2,
        color: [255, 255, 255],
        opacity: 0.25,
        speedFactor: 0.33, // how fast the particles move
        dropRate: 0.003, // how often the particles move to a random place
        dropRateBump: 0.01, // drop rate increase relative to individual particle speed
        fadeOpacity: 0.95, // how fast the particle trails fade on each frame
    },
    overlay: {
        bounds: [0, 100],
        colorFunction: MaritraceMapboxWeather.Colors.µ.extendedSinebowColor,
        opacity: 0.1,
        legendTitle: 'Wind Speed [m/s]',
        legendTicksCount: 6,
        legendWidth: 200,
    },
    retina: true,
    minZoom: 0,
    maxZoom: 14,
};

const meta = {
    source: {
        layer: 'gfs/wind',
    },
    overlay: {
        colorFunction: 'µ.extendedSinebowColor/wind',
    },
};

const layerConfigs = new Map([
    ['gfs/wind', {
        source: {
            imagePath: '../data/gfs/wind/2020061500.png',
            bounds: [[-128, -128], [127, 127]],
        },
        particles: {
            count: 1024,
        },
        overlay: {
            bounds: [0, 100],
            colorFunction: 'µ.extendedSinebowColor/wind',
            legendTitle: 'Wind Speed [m/s]',
        },
    }],
    ['gfs/temperature', {
        source: {
            imagePath: '../data/gfs/temperature/2020061500.png',
            bounds: [[-128, 0], [127, 0]],
        },
        particles: {
            count: 0,
        },
        overlay: {
            bounds: [193 - 273.15, 328 - 273.15],
            colorFunction: 'µ.segmentedColorScale/temperature',
            legendTitle: 'Temperature [°C]',
        },
    }],
    ['gfs/humidity', {
        source: {
            imagePath: '../data/gfs/humidity/2020061500.png',
            bounds: [[0, 0], [100, 0]],
        },
        particles: {
            count: 0,
        },
        overlay: {
            bounds: [0, 100],
            colorFunction: 'µ.segmentedColorScale/humidity',
            legendTitle: 'Relative Humidity [%]',
        },
    }],
    ['gfs/precipitation', {
        source: {
            imagePath: '../data/gfs/precipitation/2020061500.png',
            bounds: [[0, 0], [150, 0]],
        },
        particles: {
            count: 0,
        },
        overlay: {
            bounds: [0, 150],
            colorFunction: 'µ.segmentedColorScale/precipitation',
            legendTitle: 'Next 3-hr Precip Accumulation [kg/m²]',
        },
    }],
]);

const colorFunctions = new Map([
    ['µ.extendedSinebowColor/wind', MaritraceMapboxWeather.Colors.µ.extendedSinebowColor],
    ['µ.segmentedColorScale/temperature', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        [(193 - 193) / (328 - 193),     [37, 4, 42]],
        [(206 - 193) / (328 - 193),     [41, 10, 130]],
        [(219 - 193) / (328 - 193),     [81, 40, 40]],
        [(233.15 - 193) / (328 - 193),  [192, 37, 149]],  // -40 C/F
        [(255.372 - 193) / (328 - 193), [70, 215, 215]],  // 0 F
        [(273.15 - 193) / (328 - 193),  [21, 84, 187]],   // 0 C
        [(275.15 - 193) / (328 - 193),  [24, 132, 14]],   // just above 0 C
        [(291 - 193) / (328 - 193),     [247, 251, 59]],
        [(298 - 193) / (328 - 193),     [235, 167, 21]],
        [(311 - 193) / (328 - 193),     [230, 71, 39]],
        [(328 - 193) / (328 - 193),     [88, 27, 67]],
    ])],
    ['µ.segmentedColorScale/humidity', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        [(0 - 0) / (100 - 0), [230, 165, 30]],
        [(25 - 0) / (100 - 0), [120, 100, 95]],
        [(60 - 0) / (100 - 0), [40, 44, 92]],
        [(75 - 0) / (100 - 0), [21, 13, 193]],
        [(90 - 0) / (100 - 0), [75, 63, 235]],
        [(100 - 0) / (100 - 0), [25, 255, 255]],
    ])],
    ['µ.segmentedColorScale/precipitation', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        // TPW
        // [(0 - 0) / (70 - 0), [230, 165, 30]],
        // [(10 - 0) / (70 - 0), [120, 100, 95]],
        // [(20 - 0) / (70 - 0), [40, 44, 92]],
        // [(30 - 0) / (70 - 0), [21, 13, 193]],
        // [(40 - 0) / (70 - 0), [75, 63, 235]],
        // [(60 - 0) / (70 - 0), [25, 255, 255]],
        // [(70 - 0) / (70 - 0), [150, 255, 255]],
        [(0 - 0) / (150 - 0), [37, 79, 92]],
        [(2 - 0) / (150 - 0), [240, 248, 255]],
        [(15 - 0) / (150 - 0), [51, 26, 155]],
        [(50 - 0) / (150 - 0), [241, 1, 107]], // approximate
        [(150 - 0) / (150 - 0), [255, 215, 0]],
    ])],
    // https://github.com/d3/d3-scale-chromatic
    // Sequential
    ['d3.interpolateTurbo', d3.interpolateTurbo],
    ['d3.interpolateViridis', d3.interpolateViridis],
    ['d3.interpolateInferno', d3.interpolateInferno],
    ['d3.interpolateMagma', d3.interpolateMagma],
    ['d3.interpolatePlasma', d3.interpolatePlasma],
    ['d3.interpolateCividis', d3.interpolateCividis],
    ['d3.interpolateWarm', d3.interpolateWarm],
    ['d3.interpolateCool', d3.interpolateCool],
    ['d3.interpolateCubehelixDefault', d3.interpolateCubehelixDefault],
    ['d3.interpolateBuGn', d3.interpolateBuGn],
    ['d3.interpolateBuPu', d3.interpolateBuPu],
    ['d3.interpolateGnBu', d3.interpolateGnBu],
    ['d3.interpolateOrRd', d3.interpolateOrRd],
    ['d3.interpolatePuBuGn', d3.interpolatePuBuGn],
    ['d3.interpolatePuBu', d3.interpolatePuBu],
    ['d3.interpolatePuRd', d3.interpolatePuRd],
    ['d3.interpolateRdPu', d3.interpolateRdPu],
    ['d3.interpolateYlGnBu', d3.interpolateYlGnBu],
    ['d3.interpolateYlGn', d3.interpolateYlGn],
    ['d3.interpolateYlOrBr', d3.interpolateYlOrBr],
    ['d3.interpolateYlOrRd', d3.interpolateYlOrRd],
    // Cyclical
    ['d3.interpolateRainbow', d3.interpolateRainbow],
    ['d3.interpolateSinebow', d3.interpolateSinebow],
]);

export function initGui(config, update) {
    const gui = new dat.GUI();
    gui.width = 350;

    const source = gui.addFolder('source');
    source.add(meta.source, 'layer', Array.from(layerConfigs.keys())).onChange(async () => {
        const layerConfig = layerConfigs.get(meta.source.layer);
        Object.keys(layerConfig).forEach(key => {
            Object.keys(layerConfig[key]).forEach(key2 => {
                config[key][key2] = layerConfig[key][key2];
            });
        });

        config.source.image = await MaritraceMapboxWeather.loadImage(config.source.imagePath);
        meta.overlay.colorFunction = layerConfig.overlay.colorFunction;
        config.overlay.colorFunction = colorFunctions.get(meta.overlay.colorFunction);

        gui.updateDisplay();
        update();
    });
    source.open();

    const particles = gui.addFolder('particles');
    particles.add(config.particles, 'count', 0, 2 ** 16 - 1, 1).onFinishChange(update);
    particles.add(config.particles, 'size', 0.5, 5, 0.5);
    particles.addColor(config.particles, 'color');
    particles.add(config.particles, 'opacity', 0, 1, 0.01);
    particles.add(config.particles, 'fadeOpacity', 0.9, 1, 0.001);
    particles.add(config.particles, 'speedFactor', 0.05, 1, 0.01);
    particles.add(config.particles, 'dropRate', 0, 0.1, 0.001);
    particles.add(config.particles, 'dropRateBump', 0, 0.2, 0.01);
    particles.open();

    const overlay = gui.addFolder('overlay');
    overlay.add(meta.overlay, 'colorFunction', Array.from(colorFunctions.keys())).onChange(() => {
        config.overlay.colorFunction = colorFunctions.get(meta.overlay.colorFunction);
        update();
    });
    overlay.add(config.overlay, 'opacity', 0, 1, 0.01).onFinishChange(update);
    overlay.open();

    gui.add(config, 'retina').onChange(update);
    gui.add(config, 'minZoom', 0, 22).onFinishChange(update);
    gui.add(config, 'maxZoom', 0, 22).onFinishChange(update);
    gui.close();

    return gui;
}