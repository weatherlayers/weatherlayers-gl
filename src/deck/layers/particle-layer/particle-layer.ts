import {CompositeLayer} from '@deck.gl/core/typed';
import type {DefaultProps, UpdateParameters, LayersList} from '@deck.gl/core/typed';
import type {TextureData} from '../../../_utils/data.js';
import {createTextureCached, EMPTY_TEXTURE} from '../../../_utils/texture.js';
import {withCheckLicense} from '../../license.js';
import {ParticleLineLayer} from './particle-line-layer.js';
import type {ParticleLineLayerProps} from './particle-line-layer.js';

export type ParticleLayerProps<DataT> = ParticleLineLayerProps<DataT> & {
  image: TextureData | null;
  image2: TextureData | null;
};

const defaultProps = {
  ...ParticleLineLayer.defaultProps,

  imageTexture: undefined,
  imageTexture2: undefined,
  image: {type: 'object', value: null}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data
} as DefaultProps<ParticleLayerProps<any>>;

@withCheckLicense('ParticleLayer', defaultProps)
export class ParticleLayer<DataT = any> extends CompositeLayer<ParticleLayerProps<DataT>> {
  static layerName = 'ParticleLayer';
  static defaultProps = defaultProps;

  renderLayers(): LayersList {
    const {props, imageTexture, imageTexture2} = this.state;
    if (!props || !imageTexture) {
      return [];
    }

    return [
      new ParticleLineLayer(this.props, this.getSubLayerProps({
        ...{
          id: 'line',
          data: [],
          imageTexture,
          imageTexture2,
        } satisfies Partial<ParticleLineLayerProps<DataT>>,

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
      const {gl} = this.context;
      const {image, image2} = this.props;
  
      const imageTexture = image ? createTextureCached(gl, image) : null;
      const imageTexture2 = image2 ? createTextureCached(gl, image2) : null;
  
      this.setState({ imageTexture, imageTexture2 });
    }

    this.setState({ props: params.props });
  }
}