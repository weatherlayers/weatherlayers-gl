import {CompositeLayer} from '@deck.gl/core/typed';
import type {DefaultProps, UpdateParameters, LayersList} from '@deck.gl/core/typed';
import {withVerifyLicense} from '../../with-verify-license.js';
import {GridCompositeLayer} from './grid-composite-layer.js';
import type {GridCompositeLayerProps} from './grid-composite-layer.js';
import {GridStyle} from './grid-style.js';

export type GridLayerProps = GridCompositeLayerProps;

const defaultProps: DefaultProps<GridLayerProps> = {
  ...GridCompositeLayer.defaultProps,
};

@withVerifyLicense('GridLayer', defaultProps)
export class GridLayer extends CompositeLayer<GridLayerProps> {
  static layerName = 'GridLayer';
  static defaultProps = defaultProps;

  renderLayers(): LayersList {
    const {props} = this.state;
    if (!props) {
      return [];
    }

    return [
      new GridCompositeLayer(this.props, this.getSubLayerProps({
        id: 'composite',
      } satisfies Partial<GridCompositeLayerProps>)),
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

export {GridStyle};