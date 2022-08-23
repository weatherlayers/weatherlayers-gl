const DEFAULT_FPS = 30;

export class Animation {
  /** @type {() => void} */
  update;
  /** @type {number} */
  fps;
  /** @type {boolean} */
  running = false;
  /** @type {ReturnType<typeof window.requestAnimationFrame> | undefined} */
  raf = undefined;
  /** @type {number} */
  lastFrameTime = 0;

  /**
   * @param {() => void} update
   * @param {number} [fps]
   */
  constructor(update, fps = DEFAULT_FPS) {
    this.update = update;
    this.fps = fps;
  }

  /**
   * @returns {void}
   */
  frame() {
    const now = Date.now();
    const elapsed = now - this.lastFrameTime;
    const fpsInterval = 1000 / this.fps;
    if (elapsed > fpsInterval) {
      this.lastFrameTime = now - (elapsed % fpsInterval);
      this.update();
    }

    if (this.running) {
      this.raf = window.requestAnimationFrame(() => this.frame());
    }
  }

  /**
   * @returns {void}
   */
  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.raf = window.requestAnimationFrame(() => this.frame());
  }

  /**
   * @returns {void}
   */
  stop() {
    if (!this.running) {
      return;
    }

    this.running = false;
    if (this.raf) {
      window.cancelAnimationFrame(this.raf);
      this.raf = undefined;
    }
  }

  /**
   * @param {boolean} running
   * @returns {void}
   */
  toggle(running = !this.running) {
    if (running) {
      this.start();
    } else {
      this.stop();
    }
  }
}