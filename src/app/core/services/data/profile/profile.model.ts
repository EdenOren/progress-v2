export interface ProfileRaw {
  id: string;
  display_name: string;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  displayName: string;
  dateOfBirth: string | null;
  heightCm: number | null;
}
