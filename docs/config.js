const imagePath = '../data/gfs/2020051500.png';

export const config = {
    weather: {
        imagePath: imagePath,
        min: -128,
        max: 127,
    },
    particlesCount: 1024 * 4,
    particleSize: 1,
    particleColor: [255, 255, 255],
    particleOpacity: 0.5,
    fadeOpacity: 0.996, // how fast the particle trails fade on each frame
    speedFactor: 0.25, // how fast the particles move
    dropRate: 0.003, // how often the particles move to a random place
    dropRateBump: 0.01, // drop rate increase relative to individual particle speed
    overlay: {
        bounds: [0, 100],
        colorFunction: MaritraceMapboxWeather.Colors.extendedSinebowColor,
        opacity: 0.1,
    },
    retina: true,
};

export function initGui(config, update) {
    const colorFunctions = new Map([
        ['µ.extendedSinebowColor', MaritraceMapboxWeather.Colors.extendedSinebowColor],
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
    gui.add(config, 'particlesCount', 1, 1024 * 64 - 1, 1).onFinishChange(update);
    gui.add(config, 'particleSize', 0.5, 5, 0.5);
    gui.addColor(config, 'particleColor');
    gui.add(config, 'particleOpacity', 0, 1, 0.01);
    gui.add(config, 'fadeOpacity', 0.96, 1, 0.001).updateDisplay();
    gui.add(config, 'speedFactor', 0.05, 1, 0.01);
    gui.add(config, 'dropRate', 0, 0.1, 0.001);
    gui.add(config, 'dropRateBump', 0, 0.2, 0.01);
    const overlay = gui.addFolder('Overlay');
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