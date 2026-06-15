import type { AppError } from '../errors/app-error';

export type Result<T, E extends AppError = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<E extends AppError>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success;
}

export function isErr<T>(result: Result<T>): result is { success: false; error: AppError } {
  return !result.success;
}
