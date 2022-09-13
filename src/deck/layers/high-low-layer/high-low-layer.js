import {CompositeLayer} from '@deck.gl/core';
import {withCheckLicense} from '../../license';
import {HighLowCompositeLayer} from './high-low-composite-layer';

const defaultProps = {
  ...HighLowCompositeLayer.defaultProps,
};

@withCheckLicense(defaultProps)
class HighLowLayer extends CompositeLayer {
  renderLayers() {
    const {props} = this.state;

    if (!props) {
      return [];
    }

    return [
      new HighLowCompositeLayer(this.props, this.getSubLayerProps({
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

HighLowLayer.layerName = 'HighLowLayer';
HighLowLayer.defaultProps = defaultProps;

export {HighLowLayer};