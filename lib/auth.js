import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'rpl_exam_session';

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-session-secret-change-me';
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createSessionToken(user) {
  const payload = base64UrlEncode(JSON.stringify({
    id: user.id,
    username: user.username,
    fullName: user.full_name ?? user.fullName ?? user.username,
    role: user.role
  }));
  return `${payload}.${sign(payload)}`;
}

export function parseSessionToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  if (sign(payload) !== signature) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

export function setSessionCookie(response, user) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie(response) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
}

export function getSessionUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return parseSessionToken(token);
}

export function requireSessionUser() {
  const user = getSessionUser();
  if (!user) {
    throw new Error('unauthenticated');
  }
  return user;
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

