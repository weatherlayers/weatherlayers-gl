import {CompositeLayer} from '@deck.gl/core';
import {withCheckLicense} from '../../license';
import {ContourCpuCompositeLayer} from './contour-cpu-composite-layer';

const defaultProps = {
  ...ContourCpuCompositeLayer.defaultProps,

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

@withCheckLicense(defaultProps)
class ContourCpuLayer extends CompositeLayer {
  renderLayers() {
    const {props} = this.state;

    if (!props) {
      return [];
    }

    return [
      new ContourCpuCompositeLayer(this.props, this.getSubLayerProps({
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

ContourCpuLayer.layerName = 'ContourCpuLayer';
ContourCpuLayer.defaultProps = defaultProps;

export {ContourCpuLayer};