const METERS_PER_KM = 1000;
const METERS_PER_MILE = 1609.344;
const METERS_PER_YARD = 0.9144;

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
