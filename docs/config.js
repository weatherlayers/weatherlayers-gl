const imagePath = '../data/gfs/2020051500.png';

export const config = {
    source: {
        imagePath: imagePath,
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
};

export function initGui(config, update) {
    const colorFunctions = new Map([
        ['µ.extendedSinebowColor', MaritraceMapboxWeather.Colors.µ.extendedSinebowColor],
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

    const meta = {
        overlay: {
            colorFunction: 'µ.extendedSinebowColor',
        },
    };

    const gui = new dat.GUI();
    gui.width = 300;
    const particles = gui.addFolder('particles');
    particles.add(config.particles, 'count', 1, 1024 * 64 - 1, 1).onFinishChange(update);
    particles.add(config.particles, 'size', 0.5, 5, 0.5);
    particles.addColor(config.particles, 'color');
    particles.add(config.particles, 'opacity', 0, 1, 0.01);
    particles.add(config.particles, 'fadeOpacity', 0.9, 1, 0.001).updateDisplay();
    particles.add(config.particles, 'speedFactor', 0.05, 1, 0.01);
    particles.add(config.particles, 'dropRate', 0, 0.1, 0.001);
    particles.add(config.particles, 'dropRateBump', 0, 0.2, 0.01);
    particles.open();
    const overlay = gui.addFolder('overlay');
    overlay.add(meta.overlay, 'colorFunction', Array.from(colorFunctions.keys())).onChange(() => {
        config.overlay.colorFunction = colorFunctions.get(meta.overlay.colorFunction);
        update();
    });
    overlay.add(config.overlay, 'opacity', 0, 1, 0.01);
    overlay.open();
    gui.add(config, 'retina').onChange(update);
    gui.close();
    return gui;
}