/**
 * Edge & Node compatible HMAC-SHA256 stateless session token & OTP challenge utility.
 * Uses Web Crypto API (`crypto.subtle`) so it works identically in Next.js Edge Middleware
 * and Node.js Server Actions / API Route Handlers.
 */

export interface SessionPayload {
  userId: string;
  role: string;
  storeId?: string;
  customerId?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  kind: 'merchant' | 'admin' | 'customer' | 'otp_challenge';
  target?: string;
  codeHash?: string;
  iat: number;
  exp: number;
}

const DEFAULT_DEV_SECRET = 'seen-platform-dev-only-secret-change-in-prod';

function getSessionSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.RESEND_API_KEY ||
    process.env.DATABASE_URL ||
    DEFAULT_DEV_SECRET
  );
}

function toBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'));
  }
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function getHmacKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const secretBytes = new TextEncoder().encode(getSessionSecret());
  return crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signSessionToken(
  payload: Omit<SessionPayload, 'iat' | 'exp'>,
  ttlSeconds: number = 60 * 60 * 24 * 30
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };
  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const key = await getHmacKey('sign');
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, encodedSig] = parts;
  if (!encodedPayload || !encodedSig) return null;

  try {
    const key = await getHmacKey('verify');
    const sigBytes = fromBase64Url(encodedSig);
    const sigBuffer = sigBytes.buffer.slice(sigBytes.byteOffset, sigBytes.byteOffset + sigBytes.byteLength) as ArrayBuffer;
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuffer,
      new TextEncoder().encode(encodedPayload)
    );
    if (!valid) return null;

    const jsonStr = new TextDecoder().decode(fromBase64Url(encodedPayload));
    const parsed = JSON.parse(jsonStr) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!parsed.exp || parsed.exp < now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createOtpChallengeToken(target: string, code: string, ttlSeconds = 600): Promise<string> {
  const normalizedTarget = target.trim().toLowerCase();
  const codeHash = await sha256Hex(`${normalizedTarget}:${code.trim()}:${getSessionSecret()}`);
  return signSessionToken(
    {
      userId: 'otp-challenge',
      role: 'OTP_CHALLENGE',
      kind: 'otp_challenge',
      target: normalizedTarget,
      codeHash,
    },
    ttlSeconds
  );
}

export async function verifyOtpChallengeToken(
  token: string | undefined | null,
  target: string,
  code: string
): Promise<boolean> {
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== 'otp_challenge') return false;
  const normalizedTarget = target.trim().toLowerCase();
  if (payload.target !== normalizedTarget) return false;
  const expectedHash = await sha256Hex(`${normalizedTarget}:${code.trim()}:${getSessionSecret()}`);
  return payload.codeHash === expectedHash;
}
