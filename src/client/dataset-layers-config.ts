import type {GridStyle} from '../deck/layers/grid-layer/grid-style.js';

export interface DatasetContourLayerConfig {
  interval: number;
  majorInterval: number;
}

export interface DatasetGridLayerConfig {
  style: GridStyle;
  iconBounds?: [number, number];
}

export interface DatasetHighLowLayerConfig {
  radius: number;
}

export interface DatasetParticleLayerConfig {
  speedFactor: number;
  width: number;
}

export interface DatasetLayersConfig {
  contourLayer?: DatasetContourLayerConfig;
  gridLayer?: DatasetGridLayerConfig;
  highLowLayer?: DatasetHighLowLayerConfig;
  particleLayer?: DatasetParticleLayerConfig;
}