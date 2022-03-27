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

    const imageInterpolate = props.imageInterpolate;
    const imageType = stacCollection.summaries.imageType;
    const imageUnscale = image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection.summaries.imageBounds : null; // TODO: rename to imageUnscale in catalog
    const colormapBreaks = props.colormapBreaks || stacCollection.summaries.raster?.colormapBreaks;
    const opacity = 1; // apply separate opacity
    const rasterOpacity = Math.pow(props.opacity, 1 / 2.2); // apply gamma to opacity to make it visually "linear"

    return [
      new BaseRasterLayer(props, this.getSubLayerProps({
        id: 'base',

        dataset: undefined,
        datetime: undefined,
        datetimeInterpolate: undefined,

        image,
        image2,
        imageInterpolate,
        imageWeight,
        imageType,
        imageUnscale,

        colormapBreaks,
        opacity,
        rasterOpacity,

        bounds: stacCollection.extent.spatial.bbox[0],
        _imageCoordinateSystem: COORDINATE_SYSTEM.LNGLAT,
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
      this.state.clipBounds = getViewportClipBounds(viewport, this.state.stacCollection.extent.spatial.bbox[0]);
    }

    if (!this.state.image || dataset !== oldProps.dataset || datetime !== oldProps.datetime) {
      const startDatetime = client.getStacCollectionClosestStartDatetime(this.state.stacCollection, datetime);
      const endDatetime = client.getStacCollectionClosestEndDatetime(this.state.stacCollection, datetime);

      const imageWeight = datetimeInterpolate && startDatetime && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;

      if (dataset !== oldProps.dataset || startDatetime !== this.state.startDatetime || endDatetime !== this.state.endDatetime) {
        const [image, image2] = await Promise.all([
          startDatetime && client.loadStacCollectionDataByDatetime(dataset, startDatetime),
          endDatetime && client.loadStacCollectionDataByDatetime(dataset, endDatetime),
        ]);
  
        this.setState({ image, image2 });
      }

      this.setState({ startDatetime, endDatetime, imageWeight });
    }
    
    this.setState({ props });
  }
}

RasterLayer.layerName = 'RasterLayer';
RasterLayer.defaultProps = defaultProps;