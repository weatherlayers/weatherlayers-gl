export class AttributionControl {
  html = undefined;
  container = undefined;

  constructor(html) {
    this.html = html;
  }

  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'attribution';

    this.update(this.html);

    return this.container;
  }

  onRemove() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;
    }
  }

  update(html) {
    if (!this.container) {
      return;
    }

    this.html = html;
    this.container.innerHTML = '';

    if (!html) {
      return;
    }

    this.container.innerHTML = html;
  }
}