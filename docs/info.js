function formatNumber(value, decimals = 6) {
  return Math.floor(value * 10 ** decimals) / 10 ** decimals;
}

export class InfoControl {
  container = undefined;
  config = undefined;

  constructor(config = {}) {
    this.config = config;
  }

  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'info';
    
    const info1 = document.createElement('div');
    info1.className = 'info1';
    this.container.appendChild(info1);
    
    const info2 = document.createElement('div');
    info2.className = 'info2';
    this.container.appendChild(info2);

    this.config.deckgl.setProps({
      onViewStateChange: ({ viewState }) => this.updateInfo(viewState),
      onHover: (event) => this.updateMouseInfo(event),
    });

    return this.container;
  }

  onRemove() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;

    this.config.deckgl.setProps({
      onViewStateChange: undefined,
      onHover: undefined,
    });
    }
  }

  updateInfo(viewState) {
    const viewport = new deck.WebMercatorViewport(viewState);
    const bounds = viewport.getBounds();

    const info1 = this.container.querySelector('.info1');
    info1.innerHTML = `
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
  
  updateMouseInfo(event) {
    if (!event.coordinate) {
      return;
    }

    const info2 = this.container.querySelector('.info2');
    info2.innerHTML = `
      Mouse:<br>
      Position: ${event.coordinate.map(x => formatNumber(x)).join(', ')}<br>
    `;
    
    if (event.raster) {
      const value = event.raster.value;
      const formattedValue = WeatherLayers.formatValue(value);
      info2.innerHTML += `
        Value: ${formattedValue}<br>
      `;
      
      if (event.raster.direction) {
        const direction = event.raster.direction;
        const formattedDirection = WeatherLayers.formatDirection(direction);

        info2.innerHTML += `
          Direction: ${formattedDirection}<br>
        `;
      }
    }
  }
}