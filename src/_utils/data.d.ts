export type TextureDataArray = Uint8Array | Uint8ClampedArray | Float32Array;

export interface TextureData {
  data: TextureDataArray;
  width: number;
  height: number;
}

export type FloatDataArray = Float32Array;

export interface FloatData {
  data: TextureDataArray;
  width: number;
  height: number;
}

export function loadTextureData(url: string): Promise<TextureData>;
export function loadTextureDataCached(url: string, cache?: Map<string, any>): Promise<TextureData>;
export function loadJson<T>(url: string): Promise<T>;
export function loadJsonCached<T>(url: string, cache?: Map<string, any>): Promise<T>;
export function loadText(url: string): Promise<string>;
export function loadTextCached(url: string, cache?: Map<string, any>): Promise<string>;