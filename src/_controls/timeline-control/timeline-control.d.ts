export interface TimelineConfig {
  width: number;
  datetimes: string[];
  datetimeInterpolate: boolean;
  datetime: string;
  onStart?: () => Promise<void>;
  onStop?: () => void;
  onUpdate?: (event: TimelineUpdateEvent) => void;
}

export interface TimelineUpdateEvent {
  datetime: string;
}