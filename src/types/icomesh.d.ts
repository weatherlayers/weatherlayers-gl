declare module 'icomesh' {
  export default function icomesh(order: number, uvMap: false): {vertices: Float32Array, triangles: Uint16Array | Uint32Array};
  export default function icomesh(order: number, uvMap: true): {vertices: Float32Array, triangles: Uint16Array | Uint32Array, uv: Float32Array};
  export default function icomesh(order?: number, uvMap?: boolean): {vertices: Float32Array, triangles: Uint16Array | Uint32Array, uv?: Float32Array};
}