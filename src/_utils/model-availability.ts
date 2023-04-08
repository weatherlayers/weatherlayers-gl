export interface ModelAvailability {
  startDatetime: string;
  updateFrequencyHours: number;
  updateOffsetHours: number;
  forecastRanges: [number, number, number][];
}