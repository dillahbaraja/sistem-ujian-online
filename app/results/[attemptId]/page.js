import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getAttemptSessionById } from '../../../lib/storage.js';
import PrintButton from '../../../components/print-button.jsx';

export const dynamic = 'force-dynamic';

function getGrade(percentage) {
  if (percentage >= 85) return { grade: 'A', status: 'Sangat Memuaskan', color: '#10b981' };
  if (percentage >= 75) return { grade: 'B+', status: 'Memuaskan', color: '#0ea5e9' };
  if (percentage >= 65) return { grade: 'B', status: 'Baik', color: '#3b82f6' };
  if (percentage >= 55) return { grade: 'C', status: 'Cukup', color: '#f59e0b' };
  return { grade: 'D', status: 'Perlu Perbaikan / Remedial', color: '#ef4444' };
}

export default async function ResultPage({ params }) {
  const { attemptId } = await params;
  const session = await getAttemptSessionById(attemptId);
  if (!session) {
    notFound();
  }

  const attempt = session.attempt;
  const exam = session.exam;
  const score = attempt.score ?? 0;
  const total = attempt.total_points ?? 0;
  const percentage = attempt.percentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);
  const evaluation = getGrade(percentage);
  const incorrect = Math.max(0, total - score);

  const formattedDate = attempt.submitted_at
    ? new Date(attempt.submitted_at).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  const isEkonomi = exam?.course_name?.toLowerCase().includes('literasi digital') || exam?.title?.toLowerCase().includes('literasi digital');
  const facultyName = isEkonomi ? 'Fakultas Ekonomi dan Akuntansi' : 'Fakultas Teknik Elektro dan Informatika';

  return (
    <section className="result-container">
      <div className="panel result-card">
        {/* Certificate Header */}
        <div className="result-header">
          <div className="result-brand">
            <Image src="/unsa_logo.png" alt="UNSA" width={48} height={48} priority />
            <div>
              <span className="result-inst">UNIVERSITAS SURAKARTA</span>
              <span className="result-dept">{facultyName}</span>
            </div>
          </div>
          <span className="result-official-badge">LEMBAR HASIL UJIAN RESMI</span>
        </div>

        <hr className="result-divider" />

        {/* Student and Exam Meta */}
        <div className="result-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Mata Kuliah</span>
            <strong className="meta-value">{exam?.course_name || exam?.title || 'Ujian Online'}</strong>
          </div>
          <div className="meta-item">
            <span className="meta-label">Dosen Pengampu</span>
            <strong className="meta-value">Dr. Abdillah Baradja, S.Kom., M.Eng.</strong>
          </div>
          <div className="meta-item">
            <span className="meta-label">Nomor Induk Mahasiswa</span>
            <strong className="meta-value font-mono">{attempt.nim}</strong>
          </div>
          <div className="meta-item">
            <span className="meta-label">Nama Mahasiswa</span>
            <strong className="meta-value">{attempt.student_name}</strong>
          </div>
          <div className="meta-item full-width">
            <span className="meta-label">Waktu Pengumpulan</span>
            <strong className="meta-value">{formattedDate}</strong>
          </div>
        </div>

        {/* Score Ring Display */}
        <div className="score-hero-box">
          <div className="score-gauge">
            <div className="score-percentage-number">{percentage}%</div>
            <div className="score-badge-grade" style={{ backgroundColor: evaluation.color }}>
              Predikat: {evaluation.grade} ({evaluation.status})
            </div>
          </div>

          <div className="result-stats-row">
            <div className="result-stat-box stat-correct">
              <span className="stat-icon">✅</span>
              <div className="stat-details">
                <span className="stat-label">Jawaban Benar</span>
                <strong className="stat-count">{score} Soal</strong>
              </div>
            </div>

            <div className="result-stat-box stat-incorrect">
              <span className="stat-icon">❌</span>
              <div className="stat-details">
                <span className="stat-label">Jawaban Salah</span>
                <strong className="stat-count">{incorrect} Soal</strong>
              </div>
            </div>

            <div className="result-stat-box stat-total">
              <span className="stat-icon">📊</span>
              <div className="stat-details">
                <span className="stat-label">Total Soal</span>
                <strong className="stat-count">{total} Soal</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Message */}
        <div className="result-message">
          <p>
            Lembar jawaban Anda telah berhasil disimpan dan dinilai secara otomatis oleh sistem Computer Based Test (CBT). Hasil ini tercatat dalam pangkalan data nilai akademik.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          <PrintButton />
          <Link className="button button-primary" href="/">
            🏠 Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </section>
  );
}
