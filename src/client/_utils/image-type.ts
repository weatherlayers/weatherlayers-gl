export const ImageType = {
  SCALAR: 'SCALAR',
  VECTOR: 'VECTOR',
} as const;

export type ImageType = (typeof ImageType)[keyof typeof ImageType];