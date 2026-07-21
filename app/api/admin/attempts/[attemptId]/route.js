import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '../../../../../lib/auth.js';
import { deleteAdminAttempt } from '../../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function DELETE(request, context) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Silakan login terlebih dahulu.' }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ message: 'Akses admin diperlukan.' }, { status: 403 });
  }

  const { attemptId } = await context.params;
  const deleted = await deleteAdminAttempt(attemptId);
  if (!deleted) {
    return NextResponse.json({ message: 'Data peserta tidak ditemukan.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
