import { sha256Hex } from './crypto.ts';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface RequestContext {
  userAgent: string;
  ipAddress: string;
}

export function getRequestContext(req: Request): RequestContext {
  const userAgent: string = req.headers.get('user-agent') ?? 'Unknown device';
  const forwardedFor: string | null = req.headers.get('x-forwarded-for');
  const [ipAddress] = (forwardedFor ?? 'Unknown IP').split(',');
  return { userAgent, ipAddress: ipAddress.trim() };
}

export async function hashFingerprint(userId: string, userAgent: string): Promise<string> {
  return sha256Hex(`${userId}|${userAgent}`);
}
