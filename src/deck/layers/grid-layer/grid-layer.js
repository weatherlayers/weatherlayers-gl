import {CompositeLayer} from '@deck.gl/core';
import {withCheckLicense} from '../../license.js';
import {GridCompositeLayer} from './grid-composite-layer.js';

const defaultProps = {
  ...GridCompositeLayer.defaultProps,
};

@withCheckLicense(defaultProps)
class GridLayer extends CompositeLayer {
  renderLayers() {
    const {props} = this.state;

    if (!props) {
      return [];
    }

    return [
      new GridCompositeLayer(this.props, this.getSubLayerProps({
        id: 'composite',
      })),
    ];
  }

  updateState({props, oldProps, changeFlags}) {
    const {image, imageUnscale} = props;

    super.updateState({props, oldProps, changeFlags});

    if (imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    this.setState({ props });
  }
}

GridLayer.layerName = 'GridLayer';
GridLayer.defaultProps = defaultProps;

export {GridLayer};