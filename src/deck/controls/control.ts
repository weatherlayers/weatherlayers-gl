export abstract class Control<ControlConfig> {
  addTo(target: HTMLElement): void {
    target.appendChild(this.onAdd());
  }

  prependTo(target: HTMLElement): void {
    target.prepend(this.onAdd());
  }

  remove(): void {
    this.onRemove();
  }

  updateConfig(config: Partial<ControlConfig>): void {
    this.setConfig({ ...this.getConfig(), ...config });
  }

  abstract getConfig(): ControlConfig;

  abstract setConfig(config: ControlConfig): void;

  protected abstract onAdd(): HTMLElement;

  protected abstract onRemove(): void;
}