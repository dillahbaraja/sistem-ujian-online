import { getExamList, getSummary } from '../lib/storage.js';
import GuestStartForm from '../components/guest-start-form.jsx';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [exams, summary] = await Promise.all([getExamList(), getSummary()]);
  const exam = exams[0] ?? null;

  return (
    <section className="hero simple-hero">
      <div className="hero-card">
        <h1>Ujian Online Rekayasa Perangkat Lunak Semester II</h1>

        {exam ? (
          <GuestStartForm examId={exam.id} />
        ) : (
          <div className="panel compact-panel" style={{ marginTop: 20 }}>
            <h2>Ujian belum aktif</h2>
          </div>
        )}
      </div>
    </section>
  );
}
