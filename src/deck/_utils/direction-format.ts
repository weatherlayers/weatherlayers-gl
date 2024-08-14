export const DirectionFormat = {
  VALUE: 'VALUE',
  CARDINAL: 'CARDINAL',
  CARDINAL2: 'CARDINAL2',
  CARDINAL3: 'CARDINAL3',
} as const;

export type DirectionFormat = (typeof DirectionFormat)[keyof typeof DirectionFormat];