import { weather } from './weather.js';

window.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 720;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    document.body.appendChild(canvas);

    const metadata = await (await fetch('../data/gfs/2020051300.json')).json();
    
    const image = new Image();
    image.src = '../data/gfs/2020051300.png';
    await new Promise(resolve => image.onload = resolve);

    weather(canvas, metadata, image);
});