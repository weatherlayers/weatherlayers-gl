import type { UnitSystem } from './unit-system.js';
import type { UnitFormat } from './unit-format.js';

export interface UnitDefinition extends UnitFormat {
  system: UnitSystem;
}