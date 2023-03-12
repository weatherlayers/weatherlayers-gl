declare module 'geodesy-fn/src/spherical.js' {
  export function distance(start: GeoJSON.Position, destination: GeoJSON.Position, radius?: number): number;
  export function destinationPoint(start: GeoJSON.Position, distance: number, bearing: number, radius?: number): GeoJSON.Position; 
  export function initialBearing(start: GeoJSON.Position, destination: GeoJSON.Position): number;
}