import {CompositeLayer} from '@deck.gl/core/typed';
import type {DefaultProps, LayersList} from '@deck.gl/core/typed';
import {withVerifyLicense} from '../../with-verify-license.js';
import {FrontCompositeLayer} from './front-composite-layer.js';
import type {FrontCompositeLayerProps} from './front-composite-layer.js';
import {FrontType} from './front-type.js';

export type FrontLayerProps<DataT> = FrontCompositeLayerProps<DataT>;

const defaultProps: DefaultProps<FrontLayerProps<any>> = {
  ...FrontCompositeLayer.defaultProps,
};

@withVerifyLicense('FrontLayer', defaultProps)
export class FrontLayer<DataT = any> extends CompositeLayer<FrontLayerProps<DataT>> {
  static layerName = 'FrontLayer';
  static defaultProps = defaultProps;

  renderLayers(): LayersList {
    return [
      new FrontCompositeLayer(this.props, this.getSubLayerProps({
        id: 'composite',
      } satisfies Partial<FrontCompositeLayerProps<DataT>>)),
    ];
  }
}

export {FrontType};