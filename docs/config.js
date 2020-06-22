export const config = {
    overlay: {
        imagePath: '../data/gfs/wind/2020061500.png',
        bounds: [0, 100],
        colorFunction: MaritraceMapboxWeather.Colors.µ.extendedSinebowColor,
        opacity: 0.1,
        legendTitle: 'Wind [m/s]',
        legendTicksCount: 6,
        legendWidth: 220,
        minZoom: 0,
        maxZoom: 14,
    },
    particles: {
        imagePath: '../data/gfs/wind/2020061500.png',
        bounds: [-128, 127],
        count: 1024,
        size: 2,
        color: [255, 255, 255],
        opacity: 0.25,
        speedFactor: 0.33, // how fast the particles move
        dropRate: 0.003, // how often the particles move to a random place
        dropRateBump: 0.01, // drop rate increase relative to individual particle speed
        fadeOpacity: 0.95, // how fast the particle trails fade on each frame
        retina: true,
        minZoom: 0,
        maxZoom: 14,
    },
};

const meta = {
    overlay: {
        layer: 'gfs/wind',
        colorFunction: 'gfs/wind',
    },
    particles: {
        layer: 'gfs/wind',
    },
};

const overlayLayerConfigs = new Map([
    ['gfs/wind', {
        imagePath: '../data/gfs/wind/2020061500.png',
        bounds: [0, 100],
        colorFunction: 'gfs/wind',
        legendTitle: 'Wind [m/s]',
    }],
    ['gfs/tmp', {
        imagePath: '../data/gfs/tmp/2020061500.png',
        bounds: [193 - 273.15, 328 - 273.15],
        colorFunction: 'gfs/tmp',
        legendTitle: 'Temperature [°C]',
    }],
    ['gfs/rh', {
        imagePath: '../data/gfs/rh/2020061500.png',
        bounds: [0, 100],
        colorFunction: 'gfs/rh',
        legendTitle: 'Relative Humidity [%]',
    }],
    ['gfs/apcp03', {
        imagePath: '../data/gfs/apcp03/2020061500.png',
        bounds: [0, 150],
        colorFunction: 'gfs/apcp03',
        legendTitle: 'Next 3-hr Precipitation Accumulation [kg/m²]',
    }],
    ['gfs/cape', {
        imagePath: '../data/gfs/cape/2020061500.png',
        bounds: [0, 5000],
        colorFunction: 'gfs/cape',
        legendTitle: 'Convective Available Potential Energy [J/kg]',
    }],
    ['gfs/tpw', {
        imagePath: '../data/gfs/tpw/2020061500.png',
        bounds: [0, 70],
        colorFunction: 'gfs/tpw',
        legendTitle: 'Total Precipitable Water [kg/m²]',
    }],
    ['gfs/tcw', {
        imagePath: '../data/gfs/tcw/2020061500.png',
        bounds: [0, 1],
        colorFunction: 'gfs/tcw',
        legendTitle: 'Total Cloud Water [kg/m²]',
    }],
    ['gfs/prmsl', {
        imagePath: '../data/gfs/prmsl/2020061500.png',
        bounds: [92000 / 100, 105000 / 100],
        colorFunction: 'gfs/prmsl',
        legendTitle: 'Mean Sea Level Pressure [hPa]',
    }],
    ['gfs/aptmp', {
        imagePath: '../data/gfs/aptmp/2020061500.png',
        bounds: [236 - 273.15, 332 - 273.15],
        colorFunction: 'gfs/aptmp',
        legendTitle: 'Misery (Wind Chill & Heat Index) [°C]',
    }],
]);

const particlesLayerConfigs = new Map([
    ['none', {
        imagePath: null,
        count: 0,
    }],
    ['gfs/wind', {
        imagePath: '../data/gfs/wind/2020061500.png',
        count: 1024,
    }],
]);

const overlayColorFunctions = new Map([
    ['gfs/wind', MaritraceMapboxWeather.Colors.µ.extendedSinebowColor],
    ['gfs/tmp', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
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
    ['gfs/rh', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        [0 / 100, [230, 165, 30]],
        [25 / 100, [120, 100, 95]],
        [60 / 100, [40, 44, 92]],
        [75 / 100, [21, 13, 193]],
        [90 / 100, [75, 63, 235]],
        [100 / 100, [25, 255, 255]],
    ])],
    ['gfs/apcp03', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        [0 / 150, [37, 79, 92]],
        [2 / 150, [240, 248, 255]],
        [15 / 150, [51, 26, 155]],
        [50 / 150, [230, 0, 116]],
        [100 / 150, [255, 215, 0]],
        [150 / 150, [255, 215, 0]],
    ])],
    ['gfs/cape', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        [0 / 5000, [5, 48, 97]],        // weak
        [500 / 5000, [33, 102, 172]],   // weak
        [1000 / 5000, [67, 147, 195]],  // weak
        [1500 / 5000, [146, 197, 222]], // moderate
        [2000 / 5000, [209, 229, 240]], // moderate
        [2500 / 5000, [247, 247, 247]], // moderate
        [3000 / 5000, [253, 219, 199]], // strong
        [3500 / 5000, [244, 165, 130]], // strong
        [4000 / 5000, [214, 96, 77]],   // strong
        [4500 / 5000, [178, 24, 43]],   // extreme
        [5000 / 5000, [103, 0, 31]],    // extreme
    ])],
    ['gfs/tpw', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        [0 / 70, [230, 165, 30]],
        [10 / 70, [120, 100, 95]],
        [20 / 70, [40, 44, 92]],
        [30 / 70, [21, 13, 193]],
        [40 / 70, [75, 63, 235]],
        [60 / 70, [25, 255, 255]],
        [70 / 70, [150, 255, 255]],
    ])],
    ['gfs/tcw', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        [0.0, [5, 5, 89]],
        [0.2, [170, 170, 230]],
        [1.0, [255, 255, 255]],
    ])],
    ['gfs/prmsl', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        [(92000 - 92000) / (105000 - 92000), [40, 0, 0]],
        [(95000 - 92000) / (105000 - 92000), [187, 60, 31]],
        [(96500 - 92000) / (105000 - 92000), [137, 32, 30]],
        [(98000 - 92000) / (105000 - 92000), [16, 1, 43]],
        [(100500 - 92000) / (105000 - 92000), [36, 1, 93]],
        [(101300 - 92000) / (105000 - 92000), [241, 254, 18]],
        [(103000 - 92000) / (105000 - 92000), [228, 246, 223]],
        [(105000 - 92000) / (105000 - 92000), [255, 255, 255]],
    ])],
    ['gfs/aptmp', MaritraceMapboxWeather.Colors.µ.segmentedColorScale([
        [(241 - 236) / (332 - 236), [255, 255, 255]], // -32 C, -25 F extreme frostbite
        [(245.5 - 236) / (332 - 236), [6, 82, 255]],
        [(250 - 236) / (332 - 236), [6, 82, 255]],    // -23 C, -10 F frostbite
        [(258 - 236) / (332 - 236), [46, 131, 255]],
        [(266 - 236) / (332 - 236), [46, 131, 255]],  // -7 C, 20 F hypothermia
        [(280 - 236) / (332 - 236), [0, 0, 0]],       // 7 C, 45 F begin suckage (cold)
        [(300 - 236) / (332 - 236), [0, 0, 0]],       // 27 C, 80 F begin caution (heat)
        [(305 - 236) / (332 - 236), [247, 20, 35]],   // 32 C, 90 F extreme caution
        [(309.5 - 236) / (332 - 236), [247, 20, 35]],
        [(314 - 236) / (332 - 236), [245, 210, 5]],   // 41 C, 105 F danger
        [(320.5 - 236) / (332 - 236), [245, 210, 5]],
        [(327 - 236) / (332 - 236), [255, 255, 255]], // 54 C, 130 F extreme danger
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
    gui.width = 300;

    const overlay = gui.addFolder('overlay');
    overlay.add(meta.overlay, 'layer', Array.from(overlayLayerConfigs.keys())).onChange(async () => {
        const overlayLayerConfig = overlayLayerConfigs.get(meta.overlay.layer);
        Object.keys(overlayLayerConfig).forEach(key => {
            config.overlay[key] = overlayLayerConfig[key];
        });

        meta.overlay.colorFunction = overlayLayerConfig.colorFunction;
        config.overlay.colorFunction = overlayColorFunctions.get(meta.overlay.colorFunction);

        gui.updateDisplay();
        update();
    });
    overlay.add(meta.overlay, 'colorFunction', Array.from(overlayColorFunctions.keys())).onChange(() => {
        config.overlay.colorFunction = overlayColorFunctions.get(meta.overlay.colorFunction);
        
        update();
    });
    overlay.add(config.overlay, 'opacity', 0, 1, 0.01).onFinishChange(update);
    overlay.open();

    const particles = gui.addFolder('particles');
    particles.add(meta.particles, 'layer', Array.from(particlesLayerConfigs.keys())).onChange(async () => {
        const particlesLayerConfig = particlesLayerConfigs.get(meta.particles.layer);
        Object.keys(particlesLayerConfig).forEach(key => {
            config.particles[key] = particlesLayerConfig[key];
        });

        update();
    });
    particles.add(config.particles, 'count', 0, 2 ** 16 - 1, 1).onFinishChange(update);
    particles.add(config.particles, 'size', 0.5, 5, 0.5);
    particles.addColor(config.particles, 'color');
    particles.add(config.particles, 'opacity', 0, 1, 0.01);
    particles.add(config.particles, 'fadeOpacity', 0.9, 1, 0.001);
    particles.add(config.particles, 'speedFactor', 0.05, 1, 0.01);
    particles.add(config.particles, 'dropRate', 0, 0.1, 0.001);
    particles.add(config.particles, 'dropRateBump', 0, 0.2, 0.01);
    particles.add(config.particles, 'retina').onChange(update);
    particles.open();

    gui.close();

    return gui;
}