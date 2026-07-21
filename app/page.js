import { getExamList } from '../lib/storage.js';
import GuestStartForm from '../components/guest-start-form.jsx';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const exams = await getExamList();
  const exam = exams[0] ?? null;

  return (
    <section className="hero simple-hero">
      <div className="hero-card">
        <div className="hero-copy">
          <h1 className="hero-title">
            <span className="hero-line hero-line-1">Ujian Online</span>
            <span className="hero-line hero-line-2">Rekayasa Perangkat Lunak</span>
            <span className="hero-line hero-line-3">Semester II / Teknik Informatika</span>
            <span className="hero-line hero-line-4">Universitas Surakarta</span>
          </h1>
        </div>

        <div className="hero-content">
          {exam ? (
            <GuestStartForm examId={exam.id} />
          ) : (
            <div className="panel compact-panel" style={{ marginTop: 20 }}>
              <h2>Ujian belum aktif</h2>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
