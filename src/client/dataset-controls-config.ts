import type {DirectionType} from '../deck/_utils/direction-type.js';

export interface DatasetTooltipControlConfig {
  direction: DirectionType;
}

export interface DatasetControlsConfig {
  tooltipControl?: DatasetTooltipControlConfig;
}