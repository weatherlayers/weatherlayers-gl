export class FpsControl {
  container = undefined;
  running = false;
  raf = undefined;

  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'fps';

    this.stats = new Stats();
    this.stats.showPanel(0);
    this.container.appendChild(this.stats.dom);

    this.running = true;
    this.raf = window.requestAnimationFrame(() => this.frame());

    return this.container;
  }

  onRemove() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;

      this.running = false;
    }
  }

  frame() {
    this.stats.update();

    if (this.running) {
      this.raf = window.requestAnimationFrame(() => this.frame());
    }
  }
}