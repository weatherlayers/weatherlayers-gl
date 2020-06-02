const imagePath = '../data/gfs/2020051500.png';

var τ = 2 * Math.PI;

function colorInterpolator(start, end) {
    var r = start[0], g = start[1], b = start[2];
    var Δr = end[0] - r, Δg = end[1] - g, Δb = end[2] - b;
    return function(i, a) {
        return [Math.floor(r + i * Δr), Math.floor(g + i * Δg), Math.floor(b + i * Δb), a];
    };
}

/**
 * Produces a color style in a rainbow-like trefoil color space. Not quite HSV, but produces a nice
 * spectrum. See http://krazydad.com/tutorials/makecolors.php.
 *
 * @param hue the hue rotation in the range [0, 1]
 * @param a the alpha value in the range [0, 255]
 * @returns {Array} [r, g, b, a]
 */
function sinebowColor(hue, a) {
    // Map hue [0, 1] to radians [0, 5/6τ]. Don't allow a full rotation because that keeps hue == 0 and
    // hue == 1 from mapping to the same color.
    var rad = hue * τ * 5/6;
    rad *= 0.75;  // increase frequency to 2/3 cycle per rad

    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var r = Math.floor(Math.max(0, -c) * 255);
    var g = Math.floor(Math.max(s, 0) * 255);
    var b = Math.floor(Math.max(c, 0, -s) * 255);
    return [r, g, b, a];
}

var BOUNDARY = 0.45;
var fadeToWhite = colorInterpolator(sinebowColor(1.0, 0), [255, 255, 255]);

/**
 * Interpolates a sinebow color where 0 <= i <= j, then fades to white where j < i <= 1.
 *
 * @param i number in the range [0, 1]
 * @param a alpha value in range [0, 255]
 * @returns {Array} [r, g, b, a]
 */
function extendedSinebowColor(i, a) {
    return i <= BOUNDARY ?
        sinebowColor(i / BOUNDARY, a) :
        fadeToWhite((i - BOUNDARY) / (1 - BOUNDARY), a);
}

const colorRamp = new Array(256).fill(undefined).map((_, i) => {
    return extendedSinebowColor(Math.min(i, 100) / 100, 255);
});

export const config = {
    weather: {
        image: imagePath,
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
    overlayOpacity: 0.4,
    overlayColorRamp: colorRamp,
    retina: true,
};

export function initGui(weather) {
    const gui = new dat.GUI();
    gui.width = 300;
    gui.add(weather.config, 'particlesCount', 1, 1024 * 64 - 1, 1).onFinishChange(weather.updateConfig);
    gui.add(weather.config, 'particleSize', 0.5, 5, 0.5);
    gui.addColor(weather.config, 'particleColor');
    gui.add(weather.config, 'particleOpacity', 0, 1, 0.01);
    gui.add(weather.config, 'fadeOpacity', 0.96, 1, 0.001).updateDisplay();
    gui.add(weather.config, 'speedFactor', 0.05, 1, 0.01);
    gui.add(weather.config, 'dropRate', 0, 0.1, 0.001);
    gui.add(weather.config, 'dropRateBump', 0, 0.2, 0.01);
    gui.add(weather.config, 'overlayOpacity', 0, 1, 0.01);
    gui.add(weather.config, 'retina').onChange(weather.resize);
    gui.add(weather, 'running');
    gui.close();
    return gui;
}