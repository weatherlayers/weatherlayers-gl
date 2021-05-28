export class LegendControl {
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl legend';
    this.container.style.fontFamily = '"Helvetica Neue", Arial, Helvetica, sans-serif';
    this.container.style.fontSize = '10px';
    this.container.style.background = 'rgba(255, 255, 255, 0.5)';
    this.container.style.backdropFilter = 'blur(1px)';
    this.container.style.fontSize = '10px';
    this.container.style.color = '#333';

    return this.container;
  }

  onRemove() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;
    }
  }

  update(config) {
    if (!this.container) {
      return;
    }

    this.container.innerHTML = '';

    const xmlns = 'http://www.w3.org/2000/svg';
    const paddingY = 15;
    const svg = /** @type SVGElement */ (document.createElementNS(xmlns, 'svg'));
    svg.setAttribute('width', `${config.legendWidth + 2 * paddingY}px`);
    svg.setAttribute('height', '50px');
    svg.style.display = 'block';
    this.container.appendChild(svg);

    const title = /** @type SVGTextElement */ (document.createElementNS(xmlns, 'text'));
    title.innerHTML = config.legendTitle;
    title.style.fontWeight = 'bold';
    title.style.transform = `translate(${paddingY}px, 15px)`;
    svg.appendChild(title);

    const scale = /** @type SVGGElement */ (document.createElementNS(xmlns, 'g'));
    scale.style.transform = `translate(${paddingY}px, 22px)`;
    svg.appendChild(scale);

    const image = /** @type SVGImageElement */ (document.createElementNS(xmlns, 'image'));
    image.setAttribute('href', config.colormapUrl);
    image.setAttribute('width', `${config.legendWidth}`);
    image.setAttribute('height', '5');
    image.setAttribute('preserveAspectRatio', 'none');
    scale.appendChild(image);

    const ticks = /** @type SVGGElement */ (document.createElementNS(xmlns, 'g'));
    ticks.style.textAnchor = 'middle';
    scale.appendChild(ticks);

    const bounds = config.colorBounds;
    const delta = (bounds[1] - bounds[0]) / (config.legendTicksCount - 1);
    for (let i = 0; i < config.legendTicksCount; i++) {
      const value = bounds[0] + i * delta;
      const formattedValue = config.legendValueFormat?.(value) ?? value;
      const roundedFormattedValue = config.legendValueDecimals ? Math.round(formattedValue * 10 ** config.legendValueDecimals) / 10 ** config.legendValueDecimals : Math.round(formattedValue);

      const tick = /** @type SVGGElement */ (document.createElementNS(xmlns, 'g'));
      tick.style.transform = `translate(${(value - bounds[0]) / (bounds[1] - bounds[0]) * config.legendWidth}px, 0)`;
      ticks.appendChild(tick);

      const tickLine = /** @type SVGLineElement */ (document.createElementNS(xmlns, 'line'));
      tickLine.setAttribute('y1', '0');
      tickLine.setAttribute('y2', '10');
      tickLine.style.stroke = 'currentColor';
      tick.appendChild(tickLine);

      const tickValue = /** @type SVGTextElement */ (document.createElementNS(xmlns, 'text'));
      tickValue.innerHTML = `${roundedFormattedValue}`;
      tickValue.style.transform = 'translate(0, 22px)';
      tick.appendChild(tickValue);
    }
  }
}