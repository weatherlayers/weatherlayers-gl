export function frac(x: number): number { 
  return x % 1;
}

export function add(x: number[], y: number[]): number[] { 
  return x.map((_, i) => x[i] + y[i]);
}

export function mul(x: number[], y: number): number[] { 
  return x.map((_, i) => x[i] * y);
}

export function dot(x: number[], y: number[]): number { 
  return x.map((_, i) => x[i] * y[i]).reduce((m, n) => m + n);
}

export function mixOne(x: number, y: number, a: number): number {
  // skip interpolation for equal values to avoid precision loss
  // fixes hasPixelValue to always return true irrespectively on imageWeight when both pixel[3] === 255
  if (x === y) {
    return x;
  }

  return x * (1 - a) + y * a;
}

export function mix(x: number[], y: number[], a: number): number[] {
  return x.map((_, i) => mixOne(x[i], y[i], a));
}