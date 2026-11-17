import { NextResponse } from 'next/server';
import { searchSubmittedAttemptsByNim } from '../../../../lib/storage.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nim = searchParams.get('nim');

    if (!nim || !nim.trim()) {
      return NextResponse.json({ message: 'Nomor Induk Mahasiswa (NIM) wajib diisi.' }, { status: 400 });
    }

    const attempts = await searchSubmittedAttemptsByNim(nim.trim());
    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('Failed to search attempts by NIM:', error);
    return NextResponse.json({ message: 'Gagal mencari riwayat ujian.' }, { status: 500 });
  }
}
