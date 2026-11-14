import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '../../../../../../lib/auth.js';
import { toggleExamLock } from '../../../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function POST(request, context) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ message: 'Akses admin diperlukan.' }, { status: 403 });
  }

  const { examId } = await context.params;
  try {
    const updated = await toggleExamLock(examId);
    return NextResponse.json({ success: true, exam: updated });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Gagal mengubah status ujian.' }, { status: 500 });
  }
}
