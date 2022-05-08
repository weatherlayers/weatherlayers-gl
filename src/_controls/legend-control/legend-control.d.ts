import { Palette } from 'cpt2js';

export interface LegendConfig {
  width: number;
  ticksCount: number;
  palette?: Palette;
  dataset: string;
}