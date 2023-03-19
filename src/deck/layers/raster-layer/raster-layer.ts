import {CompositeLayer, COORDINATE_SYSTEM} from '@deck.gl/core/typed';
import type {DefaultProps, UpdateParameters, Layer} from '@deck.gl/core/typed';
import type {TextureData} from '../../../_utils/data.js';
import {createTextureCached, EMPTY_TEXTURE} from '../../../_utils/texture.js';
import {withCheckLicense} from '../../license.js';
import {RasterBitmapLayer} from './raster-bitmap-layer.js';
import type {RasterBitmapLayerProps} from './raster-bitmap-layer.js';

export type RasterLayerProps = RasterBitmapLayerProps & {
  image: TextureData | null;
  image2: TextureData | null;
};

const defaultProps = {
  ...RasterBitmapLayer.defaultProps,

  imageTexture: undefined,
  imageTexture2: undefined,
  image: {type: 'object', value: null}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
} satisfies DefaultProps<RasterLayerProps>;

// @ts-ignore
@withCheckLicense(defaultProps)
export class RasterLayer extends CompositeLayer<RasterLayerProps> {
  renderLayers(): Layer[] {
    const {props, imageTexture, imageTexture2} = this.state;
    if (!props || !imageTexture) {
      return [];
    }

    return [
      new RasterBitmapLayer(this.props, this.getSubLayerProps({
        ...{
          id: 'bitmap',
          imageTexture,
          imageTexture2,

          _imageCoordinateSystem: COORDINATE_SYSTEM.LNGLAT,
        } satisfies Partial<RasterLayerProps>,

        image: EMPTY_TEXTURE,
        image2: EMPTY_TEXTURE,
      })),
    ];
  }

  updateState(params: UpdateParameters<this>): void {
    const {image, image2, imageUnscale} = params.props;

    super.updateState(params);

    if (image && imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    if (image !== params.oldProps.image || image2 !== params.oldProps.image2) {
      this.updateTexture();
    }

    this.setState({ props: params.props });
  }

  updateTexture(): void {
    const {gl} = this.context;
    const {image, image2} = this.props;

    const imageTexture = image ? createTextureCached(gl, image) : null;
    const imageTexture2 = image2 ? createTextureCached(gl, image2) : null;

    this.setState({ imageTexture, imageTexture2 });
  }
}

RasterLayer.layerName = 'RasterLayer';
RasterLayer.defaultProps = defaultProps;