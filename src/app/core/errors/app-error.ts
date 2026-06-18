export abstract class AppError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AuthError extends AppError {
  readonly code = 'AUTH_ERROR';
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
}

export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN';
}

export class DuplicateError extends AppError {
  readonly code = 'DUPLICATE';
}

export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
}

export class InternalError extends AppError {
  readonly code = 'INTERNAL_ERROR';
}

export class VerificationRequiredError extends AppError {
  readonly code = 'VERIFICATION_REQUIRED';
}
