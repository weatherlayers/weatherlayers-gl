import { CompositeLayer } from '@deck.gl/core/typed';
import type { LayerProps, DefaultProps, UpdateParameters, LayersList } from '@deck.gl/core/typed';
import type { TextureData } from '../../../_utils/data.js';
import { createTextureCached, createEmptyTextureCached } from '../../../_utils/texture.js';
import { withVerifyLicense } from '../../with-verify-license.js';
import { ParticleLineLayer } from './particle-line-layer.js';
import type { ParticleLineLayerProps } from './particle-line-layer.js';

type _ParticleLayerProps = ParticleLineLayerProps & {
  image: TextureData | null;
  image2: TextureData | null;
};

export type ParticleLayerProps = _ParticleLayerProps & LayerProps;

const defaultProps: DefaultProps<ParticleLayerProps> = {
  ...ParticleLineLayer.defaultProps,

  imageTexture: undefined,
  imageTexture2: undefined,
  image: { type: 'object', value: null }, // object instead of image to allow reading raw data
  image2: { type: 'object', value: null }, // object instead of image to allow reading raw data
};

@withVerifyLicense('ParticleLayer', defaultProps)
export class ParticleLayer<ExtraPropsT extends {} = {}> extends CompositeLayer<ExtraPropsT & Required<_ParticleLayerProps>> {
  static layerName = 'ParticleLayer';
  static defaultProps = defaultProps;

  renderLayers(): LayersList {
    const { gl } = this.context;
    const { props, imageTexture, imageTexture2 } = this.state;
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
        } satisfies Partial<ParticleLineLayerProps>,

        image: createEmptyTextureCached(gl),
        image2: createEmptyTextureCached(gl),
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
      const { gl } = this.context;
      const { image, image2 } = this.props;
  
      const imageTexture = image ? createTextureCached(gl, image) : null;
      const imageTexture2 = image2 ? createTextureCached(gl, image2) : null;
  
      this.setState({ imageTexture, imageTexture2 });
    }

    this.setState({ props: params.props });
  }
}