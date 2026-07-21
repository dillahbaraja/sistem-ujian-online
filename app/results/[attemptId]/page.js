import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAttemptSessionById } from '../../../lib/storage.js';

export const dynamic = 'force-dynamic';

export default async function ResultPage({ params }) {
  const { attemptId } = await params;
  const session = await getAttemptSessionById(attemptId);
  if (!session) {
    notFound();
  }

  const attempt = session.attempt;
  const exam = session.exam;
  const correctCount = attempt.score ?? 0;

  return (
    <section className="result-card">
      <span className="eyebrow">Hasil Ujian</span>
      <h1>{exam?.course_name || exam?.title || 'Ujian'}</h1>
      <p className="muted">Hasil langsung tampil setelah submit sesuai kebutuhan versi awal.</p>

      <div className="result-grid">
        <div className="result-stat">
          <span>Skor benar</span>
          <strong>
            {attempt.score ?? 0}/{attempt.total_points ?? 0}
          </strong>
        </div>
        <div className="result-stat">
          <span>Persentase</span>
          <strong>{attempt.percentage ?? 0}%</strong>
        </div>
        <div className="result-stat">
          <span>Benar</span>
          <strong>{correctCount}</strong>
        </div>
      </div>

      <div className="stack" style={{ marginTop: 18 }}>
        <Link className="button primary" href="/">
          Kembali ke halaman awal
        </Link>
      </div>
    </section>
  );
}
