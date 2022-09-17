export interface TimelineConfig {
  width: number;
  datetimes: string[];
  datetime: string;
  datetimeInterpolate: boolean;
  onPreload?: (datetimes: string[]) => Promise<void>;
  onUpdate?: (datetime: string) => void;
}