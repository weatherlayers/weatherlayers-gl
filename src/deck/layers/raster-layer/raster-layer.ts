import { CompositeLayer, COORDINATE_SYSTEM } from '@deck.gl/core';
import type { LayerProps, DefaultProps, UpdateParameters, LayersList } from '@deck.gl/core';
import type { Texture } from '@luma.gl/core';
import type { TextureData } from '../../../_utils/data.js';
import { createTextureCached, createEmptyTextureCached } from '../../../_utils/texture.js';
import { withVerifyLicense } from '../../with-verify-license.js';
import { RasterBitmapLayer } from './raster-bitmap-layer.js';
import type { RasterBitmapLayerProps } from './raster-bitmap-layer.js';

type _RasterLayerProps = RasterBitmapLayerProps & {
  image: TextureData | null;
  image2: TextureData | null;
};

export type RasterLayerProps = _RasterLayerProps & LayerProps;

const defaultProps: DefaultProps<RasterLayerProps> = {
  ...RasterBitmapLayer.defaultProps,

  imageTexture: undefined,
  imageTexture2: undefined,
  image: { type: 'object', value: null }, // object instead of image to allow reading raw data
  image2: { type: 'object', value: null }, // object instead of image to allow reading raw data

  bounds: { type: 'array', value: [-180, -90, 180, 90], compare: true },
};

@withVerifyLicense('RasterLayer', defaultProps)
export class RasterLayer<ExtraPropsT extends {} = {}> extends CompositeLayer<ExtraPropsT & Required<_RasterLayerProps>> {
  static layerName = 'RasterLayer';
  static defaultProps = defaultProps;

  state!: CompositeLayer['state'] & {
    imageTexture?: Texture;
    imageTexture2?: Texture;
  };

  renderLayers(): LayersList {
    const { device } = this.context;
    const { props, imageTexture, imageTexture2 } = this.state;
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

        image: createEmptyTextureCached(device),
        image2: createEmptyTextureCached(device),
      })),
    ];
  }

  updateState(params: UpdateParameters<this>): void {
    const { image, image2, imageUnscale } = params.props;

    super.updateState(params);

    if (image && imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    if (image !== params.oldProps.image || image2 !== params.oldProps.image2) {
      const { device } = this.context;
      const { image, image2 } = this.props;
  
      const imageTexture = image ? createTextureCached(device, image) : null;
      const imageTexture2 = image2 ? createTextureCached(device, image2) : null;
  
      this.setState({ imageTexture, imageTexture2 });
    }

    this.setState({ props: params.props });
  }
}