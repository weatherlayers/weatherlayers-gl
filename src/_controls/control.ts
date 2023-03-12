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

  abstract setConfig(config: ControlConfig): void;

  abstract onAdd(): HTMLElement;

  abstract onRemove(): void;
}