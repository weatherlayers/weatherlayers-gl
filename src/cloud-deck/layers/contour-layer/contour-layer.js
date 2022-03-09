import {CompositeLayer} from '@deck.gl/core';
import {getDatetimeWeight} from '../../../_utils/datetime';
import {getViewportClipExtensions, getViewportClipBounds} from '../../../_utils/viewport';
import {formatValue} from '../../../_utils/format';
import {getClient} from '../../../cloud-client/client';
import {ContourLayer as BaseContourLayer} from '../../../deck/layers/contour-layer/contour-layer';

const defaultProps = {
  ...BaseContourLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetimeInterpolate: false,
};

export class ContourLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {props, stacCollection, image} = this.state;

    if (!props || !stacCollection || !image) {
      return [];
    }

    return [
      new BaseContourLayer(props, this.getSubLayerProps({
        id: 'base',
        image,
        imageType: stacCollection.summaries.imageType,
        imageUnscale: image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection.summaries.imageBounds : null, // TODO: rename to imageUnscale in catalog
        delta: props.delta || stacCollection.summaries.contour.delta,
        textFunction: (/** @type {number} */ value) => formatValue(value, stacCollection.summaries.unit[0]).toString(),

        bounds: stacCollection.extent.spatial.bbox[0],
        extensions: getViewportClipExtensions(viewport),
        clipBounds: getViewportClipBounds(viewport, stacCollection.extent.spatial.bbox[0]),
      })),
    ];
  }

  initializeState() {
    const client = getClient();
    this.setState({ client });
  }

  async updateState({props, oldProps, changeFlags}) {
    const {dataset, datetime, datetimeInterpolate, visible} = this.props;
    const {client} = this.state;

    super.updateState({props, oldProps, changeFlags});

    if (!visible) {
      return;
    }

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

    if (!this.state.stacCollection || dataset !== oldProps.dataset) {
      this.state.stacCollection = await client.loadStacCollection(dataset);
    }

    if (!this.state.image || dataset !== oldProps.dataset || datetime !== oldProps.datetime) {
      const startDatetime = client.getStacCollectionClosestStartDatetime(this.state.stacCollection, datetime);
      const endDatetime = client.getStacCollectionClosestEndDatetime(this.state.stacCollection, datetime);
      if (!startDatetime) {
        return;
      }

      const imageWeight = datetimeInterpolate && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;

      if (dataset !== oldProps.dataset || startDatetime !== this.state.startDatetime || endDatetime !== this.state.endDatetime) {
        const [image, image2] = await Promise.all([
          client.loadStacCollectionDataByDatetime(dataset, startDatetime),
          endDatetime && client.loadStacCollectionDataByDatetime(dataset, endDatetime),
        ]);
  
        this.setState({ image, image2 });
      }

      this.setState({ startDatetime, endDatetime, imageWeight });
    }
    
    this.setState({ props: this.props });
  }
}

ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;