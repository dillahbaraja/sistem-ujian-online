import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set({
    name: 'rpl_exam_session',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
  return response;
}
