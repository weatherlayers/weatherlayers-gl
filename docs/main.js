import { config, initGui } from './config.js';

window.addEventListener('DOMContentLoaded', async () => {
    const canvas = /** @type HTMLCanvasElement */ (document.getElementById('canvas'));
    const playPauseButton = /** @type HTMLButtonElement */ (document.getElementById('play-pause'));

    const weather = await MaritraceMapboxWeather.drawToCanvas(canvas, config);

    playPauseButton.addEventListener('click', () => {
        if (weather.playing) {
            weather.pause();
        } else {
            weather.play();
        }
    });

    initGui(weather);
});