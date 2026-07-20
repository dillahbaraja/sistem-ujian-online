import { NextResponse } from 'next/server';
import { getExamList } from '../../../lib/storage.js';

export const runtime = 'nodejs';

export async function GET() {
  const exams = await getExamList();
  return NextResponse.json({ exams });
}

