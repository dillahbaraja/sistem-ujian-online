import { getExamList } from '../lib/storage.js';
import GuestStartForm from '../components/guest-start-form.jsx';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const exams = await getExamList();

  return (
    <section className="hero simple-hero">
      <div className="hero-card">
        <div className="hero-copy">
          <h1 className="hero-title">
            <span className="hero-line hero-line-1">UJIAN ONLINE</span>
            <span className="hero-line hero-line-2">TEKNIK INFORMATIKA - FTEI</span>
            <span className="hero-line hero-line-3">UNIVERSITAS SURAKARTA</span>
          </h1>
        </div>

        <div className="hero-content">
          {exams.length > 0 ? (
            <GuestStartForm exams={exams} examId={exams[0]?.id} />
          ) : (
            <div className="panel compact-panel" style={{ marginTop: 20 }}>
              <h2>Ujian belum aktif</h2>
              <p className="muted">Belum ada mata kuliah yang dipublikasikan.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
