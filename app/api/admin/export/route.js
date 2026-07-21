import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '../../../../lib/auth.js';
import { exportAdminAttemptsCsv } from '../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Silakan login terlebih dahulu.' }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ message: 'Akses admin diperlukan.' }, { status: 403 });
  }

  const csv = await exportAdminAttemptsCsv();
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ujian-rpl-nilai.csv"'
    }
  });
}
