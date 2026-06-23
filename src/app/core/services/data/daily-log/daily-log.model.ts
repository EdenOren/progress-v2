export interface DailyLogRaw {
  id: string;
  user_id: string;
  logged_date: string;
  sleep_hours: number | null;
  weight_kg: number | null;
  water_intake_liters: number | null;
  waist_cm: number | null;
}

export interface DailyLog {
  id: string;
  userId: string;
  loggedDate: string;
  sleepHours: number | null;
  weightKg: number | null;
  waterLiters: number | null;
  waistCm: number | null;
}

export interface UpsertDailyLogInput {
  userId: string;
  loggedDate: string;
  sleepHours: number | null;
  weightKg: number | null;
  waterLiters: number | null;
  waistCm: number | null;
}
