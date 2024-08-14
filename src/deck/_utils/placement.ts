export const Placement = {
  BOTTOM: 'BOTTOM',
  TOP: 'TOP',
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
} as const;

export type Placement = (typeof Placement)[keyof typeof Placement];