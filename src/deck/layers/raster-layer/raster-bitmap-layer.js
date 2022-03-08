import {BitmapLayer} from '@deck.gl/layers';
import {code as fsDecl, tokens as fsDeclTokens} from './raster-bitmap-layer-fs-decl.glsl';
import {code as fsMainEnd} from './raster-bitmap-layer-fs-main-end.glsl';
import {ImageType} from '../../../_utils/image-type';

const defaultProps = {
  ...BitmapLayer.defaultProps,

  imageTexture: {type: 'object', value: null, required: true},
  imageTexture2: {type: 'object', value: null},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  colormapTexture: {type: 'object', value: null, required: true},
  colormapBounds: {type: 'array', value: null, required: true},

  rasterOpacity: {type: 'number', min: 0, max: 1, value: 1},
};

export class RasterBitmapLayer extends BitmapLayer {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      inject: {
        ...parentShaders.inject,
        'fs:#decl': [parentShaders.inject?.['fs:#decl'], fsDecl].join('\n'),
        'fs:#main-end': [parentShaders.inject?.['fs:#main-end'], fsMainEnd].join('\n'),
      },
    };
  }

  draw(opts) {
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageWeight, imageType, imageUnscale, rasterOpacity, colormapTexture, colormapBounds} = this.props;

    if (!imageTexture || !colormapTexture) {
      return;
    }

    if (model) {
      model.setUniforms({
        bitmapTexture: imageTexture,
        [fsDeclTokens.bitmapTexture2]: imageTexture2,
        [fsDeclTokens.imageWeight]: imageTexture2 ? imageWeight : 0,
        [fsDeclTokens.imageTypeVector]: imageType === ImageType.VECTOR,
        [fsDeclTokens.imageUnscale]: imageUnscale || [0, 0],
        [fsDeclTokens.colormapTexture]: colormapTexture,
        [fsDeclTokens.colormapBounds]: colormapBounds,
        [fsDeclTokens.rasterOpacity]: rasterOpacity,
      });

      super.draw(opts);
    }
  }
}

RasterBitmapLayer.layerName = 'RasterBitmapLayer';
RasterBitmapLayer.defaultProps = defaultProps;