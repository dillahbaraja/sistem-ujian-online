import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '../../../../lib/auth.js';
import { exportAdminAttemptsCsv } from '../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Silakan login terlebih dahulu.' }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ message: 'Akses admin diperlukan.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get('examId') || '';
  const classGroup = searchParams.get('classGroup') || '';
  const year = searchParams.get('year') || '';

  const csv = await exportAdminAttemptsCsv({ examId, classGroup, year });
  const filename = `rekap-nilai${examId ? '-matkul' : ''}${classGroup ? `-${classGroup.toLowerCase()}` : ''}${year ? `-${year}` : ''}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
