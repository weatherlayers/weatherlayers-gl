import {BitmapLayer} from '@deck.gl/layers';
import {code as fsDecl, tokens as fsDeclTokens} from './contour-gpu-bitmap-layer-fs-decl.glsl';
import {code as fsMainEnd} from './contour-gpu-bitmap-layer-fs-main-end.glsl';
import {ImageType} from '../../../_utils/image-type';
import {DEFAULT_LINE_COLOR} from '../../props';

const defaultProps = {
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  delta: {type: 'number', required: true},
  color: {type: 'color', value: DEFAULT_LINE_COLOR},
  width: {type: 'number', value: 1},

  rasterOpacity: {type: 'number', min: 0, max: 1, value: 1},
};

export class ContourGpuBitmapLayer extends BitmapLayer {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      vs: ['#version 300 es', parentShaders.vs].join('\n'),
      fs: ['#version 300 es', parentShaders.fs].join('\n'),
      inject: {
        ...parentShaders.inject,
        'fs:#decl': [parentShaders.inject?.['fs:#decl'], fsDecl].join('\n'),
        'fs:#main-end': [parentShaders.inject?.['fs:#main-end'], fsMainEnd].join('\n'),
      },
    };
  }

  draw(opts) {
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageWeight, imageType, imageUnscale, delta, color, width, rasterOpacity} = this.props;

    if (!imageTexture) {
      return;
    }

    if (model) {
      model.setUniforms({
        bitmapTexture: imageTexture,
        [fsDeclTokens.bitmapTexture2]: imageTexture2 !== imageTexture ? imageTexture2 : null,
        [fsDeclTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
        [fsDeclTokens.imageTypeVector]: imageType === ImageType.VECTOR,
        [fsDeclTokens.imageUnscale]: imageUnscale || [0, 0],
        [fsDeclTokens.delta]: delta,
        [fsDeclTokens.color]: [color[0], color[1], color[2], (color[3] ?? 255)].map(d => d / 255),
        [fsDeclTokens.width]: width,
        [fsDeclTokens.rasterOpacity]: rasterOpacity,
      });

      super.draw(opts);
    }
  }
}

ContourGpuBitmapLayer.layerName = 'ContourGpuBitmapLayer';
ContourGpuBitmapLayer.defaultProps = defaultProps;