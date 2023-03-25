import {CompositeLayer} from '@deck.gl/core/typed';
import type {DefaultProps, UpdateParameters, Layer} from '@deck.gl/core/typed';
import {withCheckLicense} from '../../license.js';
import {HighLowCompositeLayer} from './high-low-composite-layer.js';
import type {HighLowCompositeLayerProps} from './high-low-composite-layer.js';

export type HighLowLayerProps = HighLowCompositeLayerProps;

const defaultProps = {
  ...HighLowCompositeLayer.defaultProps,
} satisfies DefaultProps<HighLowLayerProps>;

// @ts-ignore
@withCheckLicense(defaultProps)
export class HighLowLayer extends CompositeLayer<HighLowLayerProps> {
  static layerName = 'HighLowLayer';
  static defaultProps = defaultProps;

  renderLayers(): Layer[] {
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