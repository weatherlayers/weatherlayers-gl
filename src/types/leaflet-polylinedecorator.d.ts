declare module 'leaflet-polylinedecorator/src/patternUtils.js' {
  type Point = {x: number, y: number};
  type PatternPart = {value: number, isInPixels: boolean};
  type Pattern = {offset: PatternPart, endOffset: PatternPart, repeat: PatternPart};
  type PointOnPath = {pt: Point, heading: number};
  export function projectPatternOnPointPath(pts: Point[], pattern: Pattern): PointOnPath[];
}