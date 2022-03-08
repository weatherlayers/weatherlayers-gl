import {initRasterLayer as initBaseRasterLayer} from '../../../arcgis/layers/raster-layer/raster-layer';
import {getClient} from '../../../cloud-client/client';

/** @typedef {import('@arcgis/core/layers/BaseTileLayer')} BaseTileLayer */

/**
 * @param {BaseTileLayer} baseTileLayer
 * @returns {BaseTileLayer}
 */
export function initRasterLayer(baseTileLayer) {
  const rasterLayer = initBaseRasterLayer(baseTileLayer);

  return rasterLayer.createSubclass({
    properties: {
      dataset: null,
      datetime: null,
      colormapBreaks: null,
    },

    load() {
      this.tileInfo.lods = [this.tileInfo.lods[0]];

      this.state = {
        client: getClient(),
      };
    },

    /**
     * @param {number} level
     * @param {number} row
     * @param {number} col
     * @param {{ signal: { aborted: boolean }}} options
     * @returns {Promise<HTMLCanvasElement>}
     */
    async fetchTile(level, row, col, options) {
      if (level > 0 || row > 0 || col > 0) {
        throw new Error('Invalid state');
      }

      const {dataset, datetime} = this;
      const {client} = this.state;

      if (!this.state.stacCollection || dataset !== this.state.loadedDataset) {
        this.state.stacCollection = await client.loadStacCollection(dataset);
        this.copyright = client.getStacCollectionAttribution(this.state.stacCollection, 'esri-attribution__link');
      }

      if (!this.state.image || dataset !== this.state.loadedDataset || datetime !== this.state.loadedDatetime) {
        const startDatetime = client.getStacCollectionClosestStartDatetime(this.state.stacCollection, datetime);
        if (!startDatetime) {
          return;
        }

        this.state.image = await client.loadStacCollectionDataByDatetime(dataset, startDatetime);
      }

      this.state.loadedDataset = dataset;
      this.state.loadedDatetime = datetime;

      if (options.signal.aborted) {
        throw new Error('Aborted');
      }

      const image = this.state.image;
      const imageType = this.state.stacCollection.summaries.imageType;
      const imageBounds = this.state.stacCollection.summaries.imageBounds;
      const colormapBreaks = this.colormapBreaks || this.state.stacCollection.summaries.raster.colormapBreaks;
      const renderedImage = this.renderImage(image, imageType, imageBounds, colormapBreaks);
      return renderedImage;
    },
  });
}