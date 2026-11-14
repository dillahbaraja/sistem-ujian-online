import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin } from '../../lib/auth.js';
import { getAllAdminExams, getSummary, listAdminAttempts } from '../../lib/storage.js';
import { hasSupabaseConfig } from '../../lib/supabase.js';
import AdminDeleteAttemptButton from '../../components/admin-delete-attempt-button.jsx';
import AdminExamToggle from '../../components/admin-exam-toggle.jsx';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (!isAdmin(user)) {
    redirect('/exams');
  }

  const resolvedSearchParams = await searchParams;
  const selectedExamId = typeof resolvedSearchParams?.examId === 'string' ? resolvedSearchParams.examId : '';
  const selectedYear = typeof resolvedSearchParams?.year === 'string' ? resolvedSearchParams.year : '';

  const [summary, exams, attempts] = await Promise.all([
    getSummary(),
    getAllAdminExams(),
    listAdminAttempts()
  ]);

  const examMap = new Map(exams.map((exam) => [exam.id, exam]));

  // Extract distinct years from submitted or created attempts
  const distinctYears = Array.from(
    new Set(
      attempts
        .map((a) => {
          const d = a.submitted_at || a.started_at || a.created_at;
          return d ? new Date(d).getFullYear() : null;
        })
        .filter(Boolean)
    )
  ).sort((a, b) => b - a);

  const currentYear = new Date().getFullYear();
  if (!distinctYears.includes(currentYear)) {
    distinctYears.unshift(currentYear);
  }

  // Filter attempts based on Exam and Year
  let filteredAttempts = attempts;
  if (selectedExamId) {
    filteredAttempts = filteredAttempts.filter((attempt) => attempt.exam_id === selectedExamId);
  }
  if (selectedYear) {
    const targetYear = parseInt(selectedYear, 10);
    filteredAttempts = filteredAttempts.filter((attempt) => {
      const d = attempt.submitted_at || attempt.started_at || attempt.created_at;
      return d ? new Date(d).getFullYear() === targetYear : false;
    });
  }

  // Build CSV export URL with active filters
  const exportParams = new URLSearchParams();
  if (selectedExamId) exportParams.set('examId', selectedExamId);
  if (selectedYear) exportParams.set('year', selectedYear);
  const exportUrl = `/api/admin/export?${exportParams.toString()}`;

  return (
    <section>
      {/* Top Admin Header */}
      <div className="panel admin-hero">
        <div>
          <span className="eyebrow">Dosen Pengampu / Admin</span>
          <h1>Dashboard Ujian Online</h1>
          <p className="muted">
            Kelola akses mata kuliah (Lock/Open), saring data mahasiswa per tahun pelaksanaan, dan ekspor nilai resmi.
          </p>
        </div>

        <form action="/api/auth/logout" method="post">
          <button className="button button-secondary" type="submit">
            🚪 Logout ({user.username})
          </button>
        </form>
      </div>

      {/* Quick Action Buttons */}
      <div className="admin-actions">
        <Link className="button button-primary" href="/admin/import">
          📥 Sinkronisasi / Import Bank Soal
        </Link>
        <a className="button button-secondary" href={exportUrl}>
          📊 Export Nilai ke CSV {selectedYear ? `(Tahun ${selectedYear})` : ''}
        </a>
      </div>

      {/* Feature 1: Lock and Open Management Card */}
      <div className="panel" style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span className="eyebrow">Pengaturan Akses</span>
            <h2 style={{ fontSize: '1.2rem', margin: '4px 0 0' }}>Buka &amp; Kunci Mata Kuliah (Lock / Open)</h2>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            💡 <em>Mata kuliah yang dikunci otomatis disembunyikan dari dropdown pilihan mahasiswa.</em>
          </span>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama Mata Kuliah</th>
                <th>Bank Soal</th>
                <th style={{ textAlign: 'right' }}>Status &amp; Kendali Akses</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td>
                    <strong>{exam.course_name || exam.title}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Durasi: {exam.duration_minutes || 60} Menit
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                      {exam.slug || '-'}
                    </span>
                  </td>
                  <td>
                    <AdminExamToggle
                      examId={exam.id}
                      initialPublished={exam.published}
                      courseName={exam.course_name || exam.title}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature 2: Filter by Exam and Year Card */}
      <div className="panel" style={{ marginTop: 22 }}>
        <span className="eyebrow">Penyaringan Data Mahasiswa</span>
        <h2 style={{ fontSize: '1.2rem', margin: '4px 0 14px' }}>Filter Berdasarkan Mata Kuliah &amp; Tahun Pelaksanaan</h2>

        <form method="get" className="field-grid">
          <label className="field">
            <span>Mata Kuliah</span>
            <select name="examId" defaultValue={selectedExamId} className="input-elevated">
              <option value="">-- Semua Mata Kuliah --</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.course_name || exam.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tahun Pelaksanaan</span>
            <select name="year" defaultValue={selectedYear} className="input-elevated">
              <option value="">-- Semua Tahun Pelaksanaan --</option>
              {distinctYears.map((year) => (
                <option key={year} value={year}>
                  Tahun {year}
                </option>
              ))}
            </select>
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="button button-primary" type="submit">
              🔍 Tampilkan Filter
            </button>
            {(selectedExamId || selectedYear) && (
              <Link href="/admin" className="button button-secondary">
                ✕ Reset Filter
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Summary Metrics */}
      <div className="mini-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 20 }}>
        <div className="mini-stat">
          <span>Total Peserta Terfilter</span>
          <strong style={{ fontSize: '1.2rem', color: '#0284c7' }}>{filteredAttempts.length} Mahasiswa</strong>
        </div>
        <div className="mini-stat">
          <span>Sudah Mengumpulkan (Submitted)</span>
          <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>
            {filteredAttempts.filter((a) => a.status === 'submitted').length} Mahasiswa
          </strong>
        </div>
        <div className="mini-stat">
          <span>Tahun Aktif Terpilih</span>
          <strong style={{ fontSize: '1.2rem' }}>
            {selectedYear ? `Tahun ${selectedYear}` : 'Semua Tahun'}
          </strong>
        </div>
      </div>

      {/* Feature 3: Student Attempts Table with Year/Date Column */}
      <div className="panel" style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <span className="eyebrow">Rekapitulasi Nilai</span>
            <h2 style={{ fontSize: '1.2rem', margin: '4px 0 0' }}>
              Daftar Peserta Ujian {selectedYear ? `(Tahun ${selectedYear})` : ''}
            </h2>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Menampilkan <strong>{filteredAttempts.length}</strong> data
          </span>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mata Kuliah</th>
                <th>NIM</th>
                <th>Nama Mahasiswa</th>
                <th>WhatsApp</th>
                <th>Waktu / Tahun</th>
                <th>Skor</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttempts.length > 0 ? (
                filteredAttempts.map((attempt) => {
                  const exam = examMap.get(attempt.exam_id);
                  const submitDate = attempt.submitted_at || attempt.started_at || attempt.created_at;
                  const formattedDate = submitDate
                    ? new Date(submitDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';

                  const percentage = attempt.total_questions > 0
                    ? Math.round(((attempt.score ?? 0) / attempt.total_questions) * 100)
                    : 0;

                  return (
                    <tr key={attempt.id}>
                      <td>
                        <strong>{exam?.course_name || exam?.title || attempt.exam_id}</strong>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{attempt.nim}</span>
                      </td>
                      <td>{attempt.student_name}</td>
                      <td>
                        <a
                          href={`https://wa.me/${attempt.whatsapp?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#059669', textDecoration: 'underline' }}
                        >
                          {attempt.whatsapp}
                        </a>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.84rem' }}>{formattedDate}</span>
                      </td>
                      <td>
                        <strong style={{ color: percentage >= 65 ? '#10b981' : '#ef4444' }}>
                          {attempt.score ?? 0}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: 4 }}>
                          ({percentage}%)
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: attempt.status === 'submitted' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: attempt.status === 'submitted' ? '#059669' : '#b45309'
                          }}
                        >
                          {attempt.status === 'submitted' ? 'Selesai' : 'Mengerjakan'}
                        </span>
                      </td>
                      <td className="table-action-cell" style={{ textAlign: 'right' }}>
                        <AdminDeleteAttemptButton attemptId={attempt.id} studentName={attempt.student_name} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '28px 12px', color: 'var(--muted)' }}>
                    Tidak ada data peserta untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 22, fontSize: '0.82rem', color: 'var(--muted)' }}>
        <span>Status Database: <strong>{hasSupabaseConfig() ? '🟢 Supabase Cloud Aktif' : '⚪ Mode Demo'}</strong></span>
      </div>
    </section>
  );
}
