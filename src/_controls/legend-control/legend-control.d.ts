import { Palette } from 'cpt2js';
import { UnitFormat } from '../../_utils/unit-format.js';

export interface LegendConfig {
  width: number;
  ticksCount: number;
  title: string;
  unitFormat: UnitFormat;
  palette: Palette;
}