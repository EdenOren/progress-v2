import { CORS_HEADERS } from './device.ts';

export enum HttpMethod {
  Options = 'OPTIONS',
}

export const JSON_HEADERS: Record<string, string> = { ...CORS_HEADERS, 'Content-Type': 'application/json' };
