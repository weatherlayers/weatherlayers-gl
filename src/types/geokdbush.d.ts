declare module 'geokdbush' {
  import KDBush from 'kdbush';
  
  export function around(
    index: KDBush,
    longitude: number,
    latitude: number,
    maxResults?: number,
    maxDistance?: number,
    filterFn?: any): number[];
  
  export function distance(
    longitude1: number,
    latitude1: number,
    longitude2: number,
    latitude2: number): number;
}