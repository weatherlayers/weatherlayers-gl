import {CompositeLayer} from '@deck.gl/core/typed';
import type {DefaultProps, UpdateParameters} from '@deck.gl/core/typed';
import {withCheckLicense} from '../../license.js';
import {GridCompositeLayer} from './grid-composite-layer.js';
import type {GridCompositeLayerProps} from './grid-composite-layer.js';
import {GridStyle} from './grid-style.js';

export type GridLayerProps = GridCompositeLayerProps;

const defaultProps = {
  ...GridCompositeLayer.defaultProps,
} satisfies DefaultProps<GridLayerProps>;

// @ts-ignore
@withCheckLicense(defaultProps)
export class GridLayer extends CompositeLayer<GridLayerProps> {
  renderLayers() {
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

  updateState(params: UpdateParameters<this>) {
    const {image, imageUnscale} = params.props;

    super.updateState(params);

    if (image && imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    this.setState({ props: params.props });
  }
}

GridLayer.layerName = 'GridLayer';
GridLayer.defaultProps = defaultProps;

export {GridStyle};