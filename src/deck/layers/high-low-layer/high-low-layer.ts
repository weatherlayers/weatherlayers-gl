import {CompositeLayer} from '@deck.gl/core/typed';
import type {DefaultProps, UpdateParameters, LayersList} from '@deck.gl/core/typed';
import {withVerifyLicense} from '../../with-verify-license.js';
import {HighLowCompositeLayer} from './high-low-composite-layer.js';
import type {HighLowCompositeLayerProps} from './high-low-composite-layer.js';

export type HighLowLayerProps = HighLowCompositeLayerProps;

const defaultProps: DefaultProps<HighLowLayerProps> = {
  ...HighLowCompositeLayer.defaultProps,
};

@withVerifyLicense('HighLowLayer', defaultProps)
export class HighLowLayer extends CompositeLayer<HighLowLayerProps> {
  static layerName = 'HighLowLayer';
  static defaultProps = defaultProps;

  renderLayers(): LayersList {
    const {props} = this.state;
    if (!props) {
      return [];
    }

    return [
      new HighLowCompositeLayer(this.props, this.getSubLayerProps({
        id: 'composite',
      } satisfies Partial<HighLowCompositeLayerProps>)),
    ];
  }

  updateState(params: UpdateParameters<this>): void {
    const {image, imageUnscale} = params.props;

    super.updateState(params);

    if (image && imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    this.setState({ props: params.props });
  }
}