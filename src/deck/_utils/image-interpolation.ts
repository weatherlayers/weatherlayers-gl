export const ImageInterpolation = {
  NEAREST: 'NEAREST',
  LINEAR: 'LINEAR',
  CUBIC: 'CUBIC',
} as const;

export type ImageInterpolation = (typeof ImageInterpolation)[keyof typeof ImageInterpolation];