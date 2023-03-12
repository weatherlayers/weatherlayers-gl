const DEFAULT_FPS = 30;

export type AnimationUpdateFunction = () => void;

export class Animation {
  updateFunction: AnimationUpdateFunction;
  fps: number;
  running: boolean = false;
  raf: ReturnType<typeof window.requestAnimationFrame> | undefined = undefined;
  lastFrameTime: number = 0;

  constructor(updateFunction: AnimationUpdateFunction, fps: number = DEFAULT_FPS) {
    this.updateFunction = updateFunction;
    this.fps = fps;
  }

  frame(): void {
    const now = Date.now();
    const elapsed = now - this.lastFrameTime;
    const fpsInterval = 1000 / this.fps;
    if (elapsed > fpsInterval) {
      this.lastFrameTime = now - (elapsed % fpsInterval);
      this.updateFunction();
    }

    if (this.running) {
      this.raf = window.requestAnimationFrame(() => this.frame());
    }
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.raf = window.requestAnimationFrame(() => this.frame());
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    if (this.raf) {
      window.cancelAnimationFrame(this.raf);
      this.raf = undefined;
    }
  }

  toggle(running: boolean = !this.running): void {
    if (running) {
      this.start();
    } else {
      this.stop();
    }
  }
}