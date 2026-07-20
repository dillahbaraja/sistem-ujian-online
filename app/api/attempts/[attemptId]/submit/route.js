import { NextResponse } from 'next/server';
import { submitGuestAttempt } from '../../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function POST(request, context) {
  const { attemptId } = await context.params;
  const payload = await request.json();
  try {
    const bundle = await submitGuestAttempt(attemptId, payload.answersByQuestionId ?? {});
    if (!bundle) {
      return NextResponse.json({ message: 'Attempt tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      attempt: {
        id: bundle.attempt.id,
        score: bundle.attempt.score,
        total_points: bundle.attempt.total_points,
        percentage: bundle.attempt.percentage,
        student_name: bundle.attempt.student_name,
        nim: bundle.attempt.nim
      }
    });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Gagal mengirim jawaban.' }, { status: 400 });
  }
}
