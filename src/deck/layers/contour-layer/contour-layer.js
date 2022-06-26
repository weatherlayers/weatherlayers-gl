import {CompositeLayer} from '@deck.gl/core';
import {withCheckLicense} from '../../license';
import {ContourCompositeLayer} from './contour-composite-layer';

const defaultProps = {
  ...ContourCompositeLayer.defaultProps,

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

@withCheckLicense(defaultProps)
class ContourLayer extends CompositeLayer {
  renderLayers() {
    const {props} = this.state;

    if (!props) {
      return [];
    }

    return [
      new ContourCompositeLayer(this.props, this.getSubLayerProps({
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

ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;

export {ContourLayer};