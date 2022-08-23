import {Control} from './control.js';

export class FpsControl extends Control {
  /** @type {HTMLElement | undefined} */
  container = undefined;
  /** @type {boolean} */
  running = false;
  /** @type {ReturnType<typeof window.requestAnimationFrame> | undefined} */
  raf = undefined;

  /**
   * @returns {HTMLElement}
   */
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'fps-control';

    this.stats = new Stats();
    this.stats.showPanel(0);
    this.container.appendChild(this.stats.dom);

    this.running = true;
    this.raf = window.requestAnimationFrame(() => this.frame());

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
    
    this.running = false;
    if (this.raf) {
      window.cancelAnimationFrame(this.raf);
      this.raf = undefined;
    }
  }

  /**
   * @returns {void}
   */
  frame() {
    this.stats.update();

    if (this.running) {
      this.raf = window.requestAnimationFrame(() => this.frame());
    }
  }
}