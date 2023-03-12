import type {Color} from '@deck.gl/core/typed';
import type {IconMapping} from '@deck.gl/layers/typed/icon-layer/icon-manager';
import iconAtlas from './front-type.icon-atlas.png';
import _iconMapping from './front-type.icon-mapping.json';

export enum FrontType {
  COLD = 'COLD',
  WARM = 'WARM',
  OCCLUDED = 'OCCLUDED',
  STATIONARY = 'STATIONARY',
}

export const FrontTypeToColor = {
  [FrontType.COLD]: [0, 0, 255],
  [FrontType.WARM]: [255, 0, 0],
  [FrontType.OCCLUDED]: [148, 0, 211],
  [FrontType.STATIONARY]: [0, 0, 255],
} satisfies {[key in FrontType]: Color};

export const FrontTypeToAlternateColor = {
  [FrontType.COLD]: null,
  [FrontType.WARM]: null,
  [FrontType.OCCLUDED]: null,
  [FrontType.STATIONARY]: [255, 0, 0],
} satisfies {[key in FrontType]: Color | null};

export {iconAtlas};
export const iconMapping = _iconMapping as unknown as IconMapping;