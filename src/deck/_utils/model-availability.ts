export interface ModelAvailability {
  updateFrequencyHours: number;
  updateOffsetHours: number;
  forecastRanges: [number, number, number][];
}