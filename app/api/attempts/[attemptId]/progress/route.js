import { NextResponse } from 'next/server';
import { saveGuestAttemptProgress } from '../../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function PATCH(request, context) {
  const { attemptId } = await context.params;
  const payload = await request.json();

  try {
    const attempt = await saveGuestAttemptProgress(attemptId, payload);
    if (!attempt) {
      return NextResponse.json({ message: 'Attempt tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        current_page: attempt.current_page,
        progress_question_number: attempt.progress_question_number,
        answered_count: attempt.answered_count,
        theme: attempt.theme
      }
    });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Gagal menyimpan progres.' }, { status: 500 });
  }
}
