import type {Device, Texture} from '@luma.gl/core';

// glyph order must match getLabelGlyph in contour-bitmap-layer.fs.glsl
export const CONTOUR_LABEL_GLYPHS = '0123456789-.';

export interface ContourLabelAtlas {
  texture: Texture;
  size: [number, number];
  cellSize: [number, number];
  padding: number;
}

export interface ContourLabelAtlasOptions {
  fontFamily: string;
  fontSize: number; // device pixels
  outlineWidth: number; // device pixels
}

// Atlas layout, in texels:
// - row 0: header, R channel of pixel i contains the advance width of glyph i
// - row 1: empty, separates the header from glyphs with linear filtering
// - rows 2+: glyph cells side by side, R channel contains fill coverage, G channel contains fill + outline coverage
// The atlas is rasterized at the target device pixel size, so that glyphs are sampled 1:1 in the shader.
export function createContourLabelAtlas(device: Device, options: ContourLabelAtlasOptions): ContourLabelAtlas {
  const {fontFamily, fontSize, outlineWidth} = options;
  const font = `${fontSize}px ${fontFamily}`;

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  measureCtx.font = font;
  const advances = Array.from(CONTOUR_LABEL_GLYPHS).map(glyph => Math.min(Math.round(measureCtx.measureText(glyph).width), 255));

  const padding = Math.ceil(outlineWidth) + 1;
  const cellWidth = Math.max(...advances) + 2 * padding;
  const cellHeight = Math.ceil(fontSize * 1.2) + 2 * padding;
  const headerHeight = 2;
  const width = cellWidth * CONTOUR_LABEL_GLYPHS.length;
  const height = headerHeight + cellHeight;

  function rasterize(outline: boolean): Uint8ClampedArray {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = cellHeight;
    const ctx = canvas.getContext('2d', {willReadFrequently: true})!;
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2 * outlineWidth;
    ctx.lineJoin = 'round';
    Array.from(CONTOUR_LABEL_GLYPHS).forEach((glyph, i) => {
      const x = i * cellWidth + padding;
      const y = cellHeight / 2;
      if (outline && outlineWidth > 0) {
        ctx.strokeText(glyph, x, y);
      }
      ctx.fillText(glyph, x, y);
    });
    return ctx.getImageData(0, 0, width, cellHeight).data;
  }

  const fill = rasterize(false);
  const outline = rasterize(true);

  const data = new Uint8Array(width * height * 4);
  advances.forEach((advance, i) => {
    data[i * 4] = advance;
  });
  for (let i = 0; i < width * cellHeight; i++) {
    const j = (headerHeight * width + i) * 4;
    data[j] = fill[i * 4 + 3];
    data[j + 1] = outline[i * 4 + 3];
  }

  const texture = device.createTexture({
    format: 'rgba8unorm',
    width,
    height,
    mipLevels: 1,
    sampler: {
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    },
  });
  texture.copyImageData({data});

  return {texture, size: [width, height], cellSize: [cellWidth, cellHeight], padding};
}
