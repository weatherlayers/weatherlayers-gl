const DEFAULT_FPS = 30;

export interface AnimationConfig {
  onUpdate: () => void;
  fps?: number;
}

export class Animation {
  private _config: AnimationConfig;
  private _running: boolean = false;
  private _raf: ReturnType<typeof window.requestAnimationFrame> | undefined = undefined;
  private _lastFrameTime: number = 0;

  constructor(config: AnimationConfig) {
    this._config = config;
  }

  getConfig(): AnimationConfig {
    return {...this._config};
  }

  setConfig(config: AnimationConfig): void {
    this._config = config;
  }

  updateConfig(config: Partial<AnimationConfig>): void {
    this.setConfig({...this._config, ...config});
  }

  get running(): boolean {
    return this._running;
  }

  toggle(running: boolean = !this._running): void {
    if (running) {
      this.start();
    } else {
      this.stop();
    }
  }

  start(): void {
    if (this._running) {
      return;
    }

    this._running = true;
    this._raf = window.requestAnimationFrame(() => this.step());
  }

  stop(): void {
    if (!this._running) {
      return;
    }

    this._running = false;
    if (this._raf) {
      window.cancelAnimationFrame(this._raf);
      this._raf = undefined;
    }
  }

  step(): void {
    const fps = this._config.fps ?? DEFAULT_FPS;
    const fpsInterval = 1000 / fps;

    const now = Date.now();
    const elapsed = now - this._lastFrameTime;
    if (elapsed > fpsInterval) {
      this._lastFrameTime = now - (elapsed % fpsInterval);
      this._config.onUpdate();
    }

    if (this._running) {
      this._raf = window.requestAnimationFrame(() => this.step());
    }
  }
}