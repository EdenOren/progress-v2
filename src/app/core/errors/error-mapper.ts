import type { PostgrestError } from '@supabase/supabase-js';
import { AuthError, DatabaseError, DuplicateError, ForbiddenError, NotFoundError } from './app-error';
import { ERROR_MESSAGES, PG_ERROR_CODES } from './error-messages.const';

export function mapSupabaseError(error: PostgrestError): ForbiddenError | DuplicateError | NotFoundError | DatabaseError {
  switch (error.code) {
    case PG_ERROR_CODES.INSUFFICIENT_PRIVILEGE:
      return new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
    case PG_ERROR_CODES.UNIQUE_VIOLATION:
      return new DuplicateError(ERROR_MESSAGES.DUPLICATE);
    case PG_ERROR_CODES.PGRST_NO_ROWS:
      return new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    default:
      return new DatabaseError(error.message);
  }
}

export function mapSupabaseAuthError(message: string): AuthError {
  return new AuthError(message);
}
