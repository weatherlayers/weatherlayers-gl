/**
 * box blur, average of 3x3 pixels
 * see https://en.wikipedia.org/wiki/Box_blur
 * see screenshot at https://gis.stackexchange.com/questions/386050/algorithm-to-find-low-high-atmospheric-pressure-systems-in-gridded-raster-data
 */
export function blur(data: Float32Array, width: number, height: number): Float32Array {
  const result = new Float32Array(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = x + y * width;

      if (x >= 1 && x <= width - 2 && y >= 1 && y <= height - 2) {
        const values = [
          data[(x - 1) + (y - 1) * width], data[(x    ) + (y - 1) * width], data[(x + 1) + (y - 1) * width],
          data[(x - 1) + (y    ) * width], data[(x    ) + (y    ) * width], data[(x + 1) + (y    ) * width],
          data[(x - 1) + (y + 1) * width], data[(x    ) + (y + 1) * width], data[(x + 1) + (y - 1) * width],
        ];
        result[i] = values.reduce((acc, curr) => acc + curr, 0) / values.length;
      } else {
        result[i] = data[i];
      }
    }
  }
  return result;
}