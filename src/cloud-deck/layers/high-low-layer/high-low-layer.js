import {CompositeLayer} from '@deck.gl/core';
import {getDatetimeWeight} from '../../../_utils/datetime';
import {getViewportClipExtensions, getViewportClipBounds} from '../../../_utils/viewport';
import {formatValue} from '../../../_utils/format';
import {getClient} from '../../../cloud-client/client';
import {HighLowLayer as BaseHighLowLayer} from '../../../deck/layers/high-low-layer/high-low-layer';

const defaultProps = {
  ...BaseHighLowLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetimeInterpolate: false,
};

export class HighLowLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {props, stacCollection, image} = this.state;

    if (!props || !stacCollection || !image) {
      return [];
    }

    const imageType = stacCollection.summaries.imageType;
    const imageUnscale = image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection.summaries.imageBounds : null; // TODO: rename to imageUnscale in catalog

    return [
      new BaseHighLowLayer(props, this.getSubLayerProps({
        id: 'base',

        dataset: undefined,
        datetime: undefined,
        datetimeInterpolate: undefined,

        image,
        imageType,
        imageUnscale,

        textFunction: this.state.textFunction,

        bounds: stacCollection.extent.spatial.bbox[0],
        extensions: getViewportClipExtensions(viewport),
        clipBounds: this.state.clipBounds,
      })),
    ];
  }

  async updateState({props, oldProps, changeFlags}) {
    const {viewport} = this.context;
    const {dataset, datetime, datetimeInterpolate} = props;

    super.updateState({props, oldProps, changeFlags});

    if (!dataset || !datetime) {
      this.setState({
        props: undefined,
        stacCollection: undefined,
        image: undefined,
        image2: undefined,
        imageWeight: undefined,
      });
      return;
    }

    const client = getClient();

    if (!this.state.stacCollection || dataset !== oldProps.dataset) {
      this.state.stacCollection = await client.loadStacCollection(dataset);

      // avoid props change in renderLayers
      this.state.textFunction = (/** @type {number} */ value) => formatValue(value, this.state.stacCollection.summaries.unit[0]).toString();
      this.state.clipBounds = getViewportClipBounds(viewport, this.state.stacCollection.extent.spatial.bbox[0]);
    }

    if (!this.state.image || dataset !== oldProps.dataset || datetime !== oldProps.datetime) {
      const startDatetime = client.getStacCollectionClosestStartDatetime(this.state.stacCollection, datetime);
      const endDatetime = client.getStacCollectionClosestEndDatetime(this.state.stacCollection, datetime);

      const imageWeight = datetimeInterpolate && startDatetime && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;

      if (dataset !== oldProps.dataset || startDatetime !== this.state.startDatetime || endDatetime !== this.state.endDatetime) {
        let [image, image2] = await Promise.all([
          startDatetime && client.loadStacCollectionData(dataset, startDatetime),
          endDatetime && client.loadStacCollectionData(dataset, endDatetime),
        ]);
  
        this.setState({ image, image2 });
      }

      this.setState({ startDatetime, endDatetime, imageWeight });
    }
    
    this.setState({ props });
  }
}

HighLowLayer.layerName = 'HighLowLayer';
HighLowLayer.defaultProps = defaultProps;