const DEFAULT_FPS = 30;

export interface AnimationConfig {
  onUpdate: () => void;
  fps?: number;
}

export class Animation {
  #config: AnimationConfig;
  #running: boolean = false;
  #raf: ReturnType<typeof window.requestAnimationFrame> | undefined = undefined;
  #lastFrameTime: number = 0;

  constructor(config: AnimationConfig) {
    this.#config = config;
  }

  getConfig(): AnimationConfig {
    return { ...this.#config };
  }

  setConfig(config: AnimationConfig): void {
    this.#config = config;
  }

  updateConfig(config: Partial<AnimationConfig>): void {
    this.setConfig({ ...this.#config, ...config });
  }

  get running(): boolean {
    return this.#running;
  }

  toggle(running: boolean = !this.#running): void {
    if (running) {
      this.start();
    } else {
      this.stop();
    }
  }

  start(): void {
    if (this.#running) {
      return;
    }

    this.#running = true;
    this.#raf = window.requestAnimationFrame(() => this.step());
  }

  stop(): void {
    if (!this.#running) {
      return;
    }

    this.#running = false;
    if (this.#raf) {
      window.cancelAnimationFrame(this.#raf);
      this.#raf = undefined;
    }
  }

  step(): void {
    const fps = this.#config.fps ?? DEFAULT_FPS;
    const fpsInterval = 1000 / fps;

    const now = Date.now();
    const elapsed = now - this.#lastFrameTime;
    if (elapsed > fpsInterval) {
      this.#lastFrameTime = now - (elapsed % fpsInterval);
      this.#config.onUpdate();
    }

    if (this.#running) {
      this.#raf = window.requestAnimationFrame(() => this.step());
    }
  }
}