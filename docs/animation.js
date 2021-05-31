export class Animation {
  running = false;
  raf = null;
  lastFrameTime = 0;

  constructor(update) {
    this.update = update;
  }

  frame() {
    const now = Date.now();
    const elapsed = now - this.lastFrameTime;
    const fps = 30;
    const fpsInterval = 1000 / fps;
    if (elapsed > fpsInterval) {
      this.lastFrameTime = now - (elapsed % fpsInterval);
      this.update();
    }

    if (this.running) {
      this.raf = window.requestAnimationFrame(() => this.frame());
    }
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.raf = window.requestAnimationFrame(() => this.frame());
  }

  stop() {
    if (!this.running) {
      return;
    }

    this.running = false;
    window.cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  toggle(running) {
    if (running) {
      this.start();
    } else {
      this.stop();
    }
  }
}