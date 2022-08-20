import { Palette } from 'cpt2js';
import { StacRasterUnit } from '../../cloud/stac';

export interface LegendConfig {
  width: number;
  ticksCount: number;
  title: string;
  unit: StacRasterUnit;
  palette: Palette;
}