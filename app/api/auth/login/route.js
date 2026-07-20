import { NextResponse } from 'next/server';
import { createSessionToken } from '../../../../lib/auth.js';
import { getCurrentUserByCredentials } from '../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function POST(request) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ message: 'Username dan password wajib diisi.' }, { status: 400 });
  }

  const user = await getCurrentUserByCredentials(username.trim(), password);
  if (!user) {
    return NextResponse.json({ message: 'Username atau password salah.' }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name ?? user.fullName ?? user.username,
      role: user.role
    }
  });

  response.cookies.set({
    name: 'rpl_exam_session',
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}

