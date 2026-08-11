// Declaration order is load-bearing: the Settings column toggles are derived from
// Object.values() and must read in the same order as the tiles on a log card.
export enum LogMetricKey {
  Sleep = 'sleep',
  Weight = 'weight',
  Water = 'water',
  Waist = 'waist',
}
