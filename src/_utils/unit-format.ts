import { UnitSystem } from './unit-system.js';

export interface UnitFormat {
  system: UnitSystem;
  unit: string;
  scale?: number;
  offset?: number;
  decimals?: number;
}