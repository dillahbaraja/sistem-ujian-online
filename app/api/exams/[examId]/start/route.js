import { NextResponse } from 'next/server';
import { startGuestExamAttempt } from '../../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function POST(request, context) {
  const { examId } = await context.params;
  const payload = await request.json();
  const nim = String(payload.nim ?? '').trim();
  const studentName = String(payload.studentName ?? '').trim();
  const whatsapp = String(payload.whatsapp ?? '').trim();
  const theme = payload.theme === 'light' ? 'light' : 'dark';

  if (!nim || !studentName || !whatsapp) {
    return NextResponse.json({ message: 'NIM, nama, dan WhatsApp wajib diisi.' }, { status: 400 });
  }

  try {
    const session = await startGuestExamAttempt(examId, {
      nim,
      studentName,
      whatsapp,
      theme
    });

    if (!session) {
      return NextResponse.json({ message: 'Sesi ujian tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      attempt: {
        id: session.attempt.id,
        status: session.attempt.status,
        resume: session.resume === true
      }
    });
  } catch (error) {
    if (error.code === 'ALREADY_SUBMITTED') {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: error.message || 'Gagal memulai ujian.' }, { status: 500 });
  }
}
