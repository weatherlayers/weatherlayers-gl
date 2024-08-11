import type { UnitFormat } from './unit-format.js';
import type { UnitSystem } from './unit-system.js';

export interface UnitDefinition extends UnitFormat {
  system: UnitSystem;
}