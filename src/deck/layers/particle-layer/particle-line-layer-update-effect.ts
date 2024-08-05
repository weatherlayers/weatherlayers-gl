import type { Effect, PreRenderOptions } from '@deck.gl/core';
import { ParticleLineLayer } from './particle-line-layer.js';

export class ParticleLineLayerUpdateEffect implements Effect {
  id = 'particle-update-effect';
  props = null;

  setup(): void {}

  preRender({ layers }: PreRenderOptions): void {
    const particleLineLayers = layers.filter(layer => layer instanceof ParticleLineLayer).filter(layer => layer.props.visible && layer.props.animate);
    particleLineLayers.forEach(layer => {
      layer.step();
    });
  }

  cleanup(): void {}
}