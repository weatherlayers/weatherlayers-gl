declare module '@luma.gl/core' {
  export type Device = WebGLRenderingContext | WebGL2RenderingContext;

  export const FEATURES: { [key: string]: string };
  export function isWebGL2(device: Device): boolean;
  export function hasFeatures(device: Device, features: string | string[]): boolean;

  // see https://github.com/visgl/luma.gl/blob/v8.6.0-alpha.5/modules/api/src/adapter/texture.ts
  export type TextureProps = {
    data?: any;
    width?: number;
    height?: number;
    depth?: number;
  
    pixels?: any;
    format?: number;
    dataFormat?: number;
    border?: number;
    recreate?: boolean;
    type?: number;
    compressed?: boolean;
    mipmaps?: boolean;
  
    parameters?: object;
    pixelStore?: object;
    textureUnit?: number;
  
    target?: number;
  };

  export class Texture2D {
    constructor(device: Device, props: TextureProps);

    get width(): number;
    get height(): number;
  }

  export class Buffer {
    constructor(device: Device, props: any);
  }
  
  export class Transform {
    constructor(device: Device, props: any);
  }
}