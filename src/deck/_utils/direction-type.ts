// see https://developers.arcgis.com/javascript/latest/api-reference/esri-renderers-VectorFieldRenderer.html#flowRepresentation
export const DirectionType = {
  INWARD: 'INWARD',
  OUTWARD: 'OUTWARD',
} as const;

export type DirectionType = (typeof DirectionType)[keyof typeof DirectionType];