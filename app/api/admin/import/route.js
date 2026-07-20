import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '../../../../lib/auth.js';
import { importMarkdownBankToSupabase } from '../../../../lib/storage.js';

export const runtime = 'nodejs';

export async function POST() {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Silakan login terlebih dahulu.' }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ message: 'Akses admin diperlukan.' }, { status: 403 });
  }

  try {
    const result = await importMarkdownBankToSupabase();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Import gagal.' }, { status: 500 });
  }
}
