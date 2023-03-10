export const FrontType = {
  COLD: 'COLD',
  WARM: 'WARM',
  OCCLUDED: 'OCCLUDED',
  STATIONARY: 'STATIONARY',
};

export const FrontTypeToColor = {
  [FrontType.COLD]: [0, 0, 255],
  [FrontType.WARM]: [255, 0, 0],
  [FrontType.OCCLUDED]: [148, 0, 211],
  [FrontType.STATIONARY]: [0, 0, 255],
};

export const FrontTypeToAlternateColor = {
  [FrontType.STATIONARY]: [255, 0, 0],
};

export const FrontTypeToIndex = {
  [FrontType.COLD]: 0,
  [FrontType.WARM]: 1,
  [FrontType.OCCLUDED]: 2,
  [FrontType.STATIONARY]: 3,
};

export {default as iconAtlas} from './front.png';
export {default as iconMapping} from './front.json';