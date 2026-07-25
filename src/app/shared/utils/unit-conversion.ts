import { WeightUnit } from '../enums/weight-unit.enum';

const METERS_PER_KM = 1000;
const METERS_PER_MILE = 1609.344;
const METERS_PER_YARD = 0.9144;
const LB_PER_KG = 2.20462;
const CM_PER_IN = 2.54;
const ROUNDING_FACTOR = 10;

export function metersToKm(meters: number): number {
  return meters / METERS_PER_KM;
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

export function metersToYards(meters: number): number {
  return meters / METERS_PER_YARD;
}

export function kmToMeters(km: number): number {
  return km * METERS_PER_KM;
}

export function milesToMeters(miles: number): number {
  return miles * METERS_PER_MILE;
}

export function yardsToMeters(yards: number): number {
  return yards * METERS_PER_YARD;
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = {
  [WeightUnit.Kg]: 'kg',
  [WeightUnit.Lb]: 'lb',
};

export const WAIST_UNIT_LABELS: Record<WeightUnit, string> = {
  [WeightUnit.Kg]: 'cm',
  [WeightUnit.Lb]: 'in',
};
