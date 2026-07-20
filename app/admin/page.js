import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin } from '../../lib/auth.js';
import { getSummary, listAdminAttempts } from '../../lib/storage.js';
import { hasSupabaseConfig } from '../../lib/supabase.js';
import AdminDeleteAttemptButton from '../../components/admin-delete-attempt-button.jsx';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (!isAdmin(user)) {
    redirect('/exams');
  }

  const [summary, attempts] = await Promise.all([getSummary(), listAdminAttempts()]);

  return (
    <section>
      <div className="panel admin-hero">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Dashboard ujian</h1>
          <p className="muted">Lihat peserta, progress terakhir, score, dan export CSV dari sini.</p>
        </div>

        <form action="/api/auth/logout" method="post">
          <button className="button ghost" type="submit">
            Logout
          </button>
        </form>
      </div>

      <div className="admin-actions">
        <Link className="button primary" href="/admin/import">
          Import bank soal
        </Link>
        <a className="button ghost" href="/api/admin/export">
          Export CSV
        </a>
      </div>

      <div className="section-grid" style={{ marginTop: 18 }}>
        <div className="metric">
          <span>Peserta</span>
          <strong>{summary.attemptCount}</strong>
        </div>
        <div className="metric">
          <span>Submitted</span>
          <strong>{summary.submittedCount}</strong>
        </div>
        <div className="metric">
          <span>Soal</span>
          <strong>{summary.questionCount}</strong>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <span className="eyebrow">Daftar Mahasiswa</span>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama</th>
                <th>WhatsApp</th>
                <th>Progress</th>
                <th>Score</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {attempts.length > 0 ? (
                attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{attempt.nim}</td>
                    <td>{attempt.student_name}</td>
                    <td>{attempt.whatsapp}</td>
                    <td>
                      {attempt.progress_question_number}/{attempt.total_questions} ({attempt.current_page})
                    </td>
                    <td>{attempt.score ?? 0}</td>
                    <td>{attempt.status}</td>
                    <td className="table-action-cell">
                      <AdminDeleteAttemptButton attemptId={attempt.id} studentName={attempt.student_name} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">Belum ada data peserta.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <span className="eyebrow">Env</span>
        <p className="muted">
          {hasSupabaseConfig()
            ? 'Supabase aktif.'
            : 'Supabase belum aktif, data akan memakai mode demo lokal.'}
        </p>
      </div>
    </section>
  );
}
