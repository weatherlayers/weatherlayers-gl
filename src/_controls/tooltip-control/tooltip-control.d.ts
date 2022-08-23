import { StacRasterUnit } from '../../cloud/stac';

export interface TooltipConfig {
  unit: StacRasterUnit;
}

export interface TooltipHoverEvent {
  value: number;
  direction?: number;
}