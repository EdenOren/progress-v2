export const PG_ERROR_CODES = {
  INSUFFICIENT_PRIVILEGE: '42501',
  UNIQUE_VIOLATION: '23505',
  PGRST_NO_ROWS: 'PGRST116',
} as const;

export const ERROR_MESSAGES = {
  FORBIDDEN: 'You do not have permission to perform this action',
  DUPLICATE: 'This record already exists',
  NOT_FOUND: 'The requested resource was not found',
} as const;
