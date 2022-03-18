import { ColormapBreak } from "../../_utils/colormap";

export interface LegendConfig {
  width: number;
  ticksCount: number;
  colormapBounds?: ColormapBreak[];
  dataset: string;
}