import {COORDINATE_SYSTEM, CompositeLayer} from '@deck.gl/core';
import {getDatetimeWeight} from '../../../_utils/datetime';
import {getViewportClipExtensions, getViewportClipBounds} from '../../../_utils/viewport';
import {getClient} from '../../../cloud-client/client';
import {RasterLayer as BaseRasterLayer} from '../../../deck/layers/raster-layer/raster-layer';

const defaultProps = {
  ...BaseRasterLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetimeInterpolate: false,
};

export class RasterLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {props, stacCollection, image, image2, imageWeight} = this.state;

    if (!props || !stacCollection || !image) {
      return [];
    }

    return [
      new BaseRasterLayer(props, this.getSubLayerProps({
        id: 'base',
        image,
        image2,
        imageWeight,
        imageType: stacCollection.summaries.imageType,
        imageUnscale: image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection.summaries.imageBounds : null, // TODO: rename to imageUnscale in catalog
        colormapBreaks: props.colormapBreaks || stacCollection.summaries.raster.colormapBreaks,
        opacity: 1, // apply separate opacity
        rasterOpacity: Math.pow(props.opacity, 1 / 2.2), // apply gamma to opacity to make it visually "linear"

        bounds: stacCollection.extent.spatial.bbox[0],
        _imageCoordinateSystem: COORDINATE_SYSTEM.LNGLAT,
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

RasterLayer.layerName = 'RasterLayer';
RasterLayer.defaultProps = defaultProps;