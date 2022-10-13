import { Palette } from 'cpt2js';
import { TextureData } from '../_utils/data';
import { ImageType } from '../_utils/image-type';
import { UnitFormat } from '../_utils/unit-format';

export interface ClientConfig {
  url: string;
  accessToken?: string;
  dataFormat: string;
}

export interface LoadDatasetOptions {
  attributionLinkClass?: string;
}

export interface Dataset {
  title: string;
  unitFormat: UnitFormat;
  attribution: string;
  datetimes: string[];
  palette: Palette;
}

export interface LoadDatasetDataOptions {
  datetimeInterpolate?: boolean;
}

export interface DatasetData {
  image: TextureData;
  image2: TextureData | null; // applicable only if datetimeInterpolate is enabled
  imageWeight: number; // applicable only if datetimeInterpolate is enabled
  imageType: ImageType;
  imageUnscale: [number, number] | null;
  bounds: [number, number, number, number];
}