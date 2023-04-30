declare module '*.glsl' {
  export const sourceCode: string;
  export const tokens: { [key: string]: string };
}