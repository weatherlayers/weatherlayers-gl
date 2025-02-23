export const UnitSystem = {
  METRIC: 'METRIC',
  METRIC_KILOMETERS: 'METRIC_KILOMETERS',
  IMPERIAL: 'IMPERIAL',
  NAUTICAL: 'NAUTICAL',
} as const;

export type UnitSystem = (typeof UnitSystem)[keyof typeof UnitSystem];