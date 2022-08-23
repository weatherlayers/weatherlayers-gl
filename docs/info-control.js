import {Control} from './control.js';

function formatNumber(value, decimals = 6) {
  return Math.floor(value * 10 ** decimals) / 10 ** decimals;
}

export class InfoControl extends Control {
  /** @type {HTMLElement | undefined} */
  container = undefined;

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'info-control';

    return this.container;
  }

  /**
   * @returns {void}
   */
  onRemove() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;
    }
  }

  /**
   * @param {any} viewState
   */
  update(viewState) {
    const viewport = new deck.WebMercatorViewport(viewState);
    const bounds = viewport.getBounds();

    this.container.innerHTML = '';

    const div = document.createElement('div');
    this.container.appendChild(div);

    div.innerHTML = `
      Center: ${formatNumber(viewport.longitude)}, ${formatNumber(viewport.latitude)}<br>
      Altitude: ${formatNumber(viewport.altitude)}<br>
      Zoom: ${formatNumber(viewport.zoom)}<br>
      Pitch: ${formatNumber(viewport.pitch)}<br>
      Bearing: ${formatNumber(viewport.bearing)}<br>
      <br>
      Bounds:<br>
      <div class="grid-2">
        ${bounds.slice(0, 2).map((x, i, array) => `<span>${formatNumber(x)}${i < array.length - 1 ? ',' : ''}</span>`).join('')}
        ${bounds.slice(2, 4).map((x, i, array) => `<span>${formatNumber(x)}${i < array.length - 1 ? ',' : ''}</span>`).join('')}
      </div><br>
    `;
  }
}