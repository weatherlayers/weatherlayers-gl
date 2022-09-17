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