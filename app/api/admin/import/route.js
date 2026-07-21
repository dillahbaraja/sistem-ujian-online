import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '../../../../lib/auth.js';
import { importMarkdownBanksToSupabase } from '../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Silakan login terlebih dahulu.' }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ message: 'Akses admin diperlukan.' }, { status: 403 });
  }

  try {
    const result = await importMarkdownBanksToSupabase();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Import gagal.' }, { status: 500 });
  }
}
