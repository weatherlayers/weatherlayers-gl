export interface TimelineConfig {
  width: number;
  dataset: string;
  datetime: string;
  datetimeInterpolate: boolean;
  onUpdate: (event: TimelineUpdateEvent) => void;
}

export interface TimelineUpdateEvent {
  datetime: string;
}