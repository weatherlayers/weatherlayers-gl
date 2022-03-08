import {COORDINATE_SYSTEM, CompositeLayer} from '@deck.gl/core';
import {ClipExtension} from '@deck.gl/extensions';
import {ContourGpuLayer as BaseContourGpuLayer} from '../../../deck/layers/contour-layer/contour-gpu-layer';
import {getClient} from '../../../cloud-client/client';
import {getDatetimeWeight} from '../../../_utils/datetime';
import {clipBounds} from '../../../_utils/bounds';

const defaultProps = {
  ...BaseContourGpuLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetimeInterpolate: false,
};

export class ContourGpuLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {props, stacCollection, image, image2, imageWeight} = this.state;
    const isGlobeViewport = !!viewport.resolution;

    if (!props || !stacCollection || !image) {
      return [];
    }

    return [
      new BaseContourGpuLayer(props, this.getSubLayerProps({
        id: 'base',
        image,
        image2,
        imageWeight,
        imageType: stacCollection.summaries.imageType,
        imageUnscale: image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection.summaries.imageBounds : null, // TODO: rename to imageUnscale in catalog
        delta: props.delta || stacCollection.summaries.contour.delta,
        opacity: 1, // apply separate opacity
        rasterOpacity: Math.pow(props.opacity, 1 / 2.2), // apply gamma to opacity to make it visually "linear"

        bounds: stacCollection.extent.spatial.bbox[0],
        _imageCoordinateSystem: COORDINATE_SYSTEM.LNGLAT,
        extensions: !isGlobeViewport ? [new ClipExtension()] : [],
        clipBounds: !isGlobeViewport ? clipBounds(stacCollection.extent.spatial.bbox[0]) : undefined,
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

ContourGpuLayer.layerName = 'ContourGpuLayer';
ContourGpuLayer.defaultProps = defaultProps;