import {CompositeLayer} from '@deck.gl/core/typed';
import type {DefaultProps, Layer} from '@deck.gl/core/typed';
import {withCheckLicense} from '../../license.js';
import {FrontCompositeLayer} from './front-composite-layer.js';
import type {FrontCompositeLayerProps} from './front-composite-layer.js';
import {FrontType} from './front-type.js';

export type FrontLayerProps<DataT> = FrontCompositeLayerProps<DataT>;

const defaultProps = {
  ...FrontCompositeLayer.defaultProps,
} satisfies DefaultProps<FrontLayerProps<any>>;

// @ts-ignore
@withCheckLicense(defaultProps)
export class FrontLayer<DataT = any> extends CompositeLayer<FrontLayerProps<DataT>> {
  static layerName = 'FrontLayer';
  static defaultProps = defaultProps;

  renderLayers(): Layer[] {
    return [
      new FrontCompositeLayer(this.props, this.getSubLayerProps({
        id: 'composite',
      } satisfies Partial<FrontCompositeLayerProps<DataT>>)),
    ];
  }
}

export {FrontType};