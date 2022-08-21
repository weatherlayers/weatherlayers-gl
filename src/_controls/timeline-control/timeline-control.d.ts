export interface TimelineConfig {
  width: number;
  datetimes: string[];
  datetimeInterpolate: boolean;
  datetime: string;
  onPreload?: (datetimes: string[]) => Promise<void>;
  onUpdate?: (datetime: string) => void;
}