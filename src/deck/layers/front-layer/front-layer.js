import {CompositeLayer} from '@deck.gl/core';
import {withCheckLicense} from '../../license.js';
import {FrontCompositeLayer} from './front-composite-layer.js';
import {FrontType} from './front-type.js';

const defaultProps = {
  ...FrontCompositeLayer.defaultProps,
};

@withCheckLicense(defaultProps)
class FrontLayer extends CompositeLayer {
  renderLayers() {
    const {props} = this.state;

    if (!props) {
      return [];
    }

    return [
      new FrontCompositeLayer(this.props, this.getSubLayerProps({
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

FrontLayer.layerName = 'FrontLayer';
FrontLayer.defaultProps = defaultProps;

export {FrontLayer, FrontType};