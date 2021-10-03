import GL from '@luma.gl/constants';

const keys = [
  'FLOAT',
  'RGBA',
  'LUMINANCE_ALPHA',
  'LINEAR',
  'TEXTURE_MAG_FILTER',
  'TEXTURE_MIN_FILTER',
  'TEXTURE_WRAP_S',
  'TEXTURE_WRAP_T',
  'REPEAT',
  'CLAMP_TO_EDGE',
  'RG32F',
  'R32F',
];

const filteredGL = Object.fromEntries(
  Array.from(Object.entries(GL)).filter(([key]) => keys.includes(key))
);

export default filteredGL;