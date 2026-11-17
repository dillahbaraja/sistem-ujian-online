'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getGradeBadge(percentage) {
  if (percentage >= 85) return { grade: 'A', status: 'Sangat Memuaskan', color: '#10b981' };
  if (percentage >= 75) return { grade: 'B+', status: 'Memuaskan', color: '#0ea5e9' };
  if (percentage >= 65) return { grade: 'B', status: 'Baik', color: '#3b82f6' };
  if (percentage >= 55) return { grade: 'C', status: 'Cukup', color: '#f59e0b' };
  return { grade: 'D', status: 'Perlu Perbaikan', color: '#ef4444' };
}

function formatSubmitDate(isoString) {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';
  } catch {
    return isoString;
  }
}

export default function GuestStartForm({ exams = [], examId }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('start'); // 'start' | 'results'

  // Exam registration form state
  const [nim, setNim] = useState('');
  const [studentName, setStudentName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [theme, setTheme] = useState('light');
  const [selectedExamId, setSelectedExamId] = useState(examId ?? exams[0]?.id ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Results search state
  const [searchNim, setSearchNim] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundAttempts, setFoundAttempts] = useState([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  useEffect(() => {
    setSelectedExamId(examId ?? exams[0]?.id ?? '');
  }, [examId, exams]);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  async function handleStart(event) {
    event.preventDefault();
    setError('');

    if (!nim.trim() || !studentName.trim() || !whatsapp.trim()) {
      setError('Mohon lengkapi NIM, Nama Lengkap, dan Nomor WhatsApp Anda.');
      return;
    }

    if (!selectedExamId) {
      setError('Silakan pilih mata kuliah ujian terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/exams/${selectedExamId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nim,
          studentName,
          whatsapp,
          theme
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Gagal memulai ujian.');
        setLoading(false);
        return;
      }

      if (payload.attempt.status === 'submitted' || payload.attempt.alreadySubmitted) {
        router.push(`/results/${payload.attempt.id}`);
        router.refresh();
        return;
      }

      router.push(`/attempts/${payload.attempt.id}`);
      router.refresh();
    } catch {
      setError('Terjadi kendala koneksi saat memulai ujian. Silakan coba lagi.');
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    setSearchError('');

    if (!searchNim.trim()) {
      setSearchError('Silakan masukkan Nomor Induk Mahasiswa (NIM) terlebih dahulu.');
      return;
    }

    setSearching(true);
    setSearched(false);

    try {
      const res = await fetch(`/api/results/search?nim=${encodeURIComponent(searchNim.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.message || 'Gagal mencari data nilai ujian.');
        setSearching(false);
        return;
      }

      setFoundAttempts(data.attempts || []);
      setSearched(true);
    } catch {
      setSearchError('Gagal terhubung ke server saat mencari nilai. Silakan coba lagi.');
    } finally {
      setSearching(false);
    }
  }

  const activeExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  return (
    <div className="start-container">
      {/* Primary Tab Navigation */}
      <div className="home-tabs-bar">
        <button
          type="button"
          className={`home-tab-pill ${activeTab === 'start' ? 'active' : ''}`}
          onClick={() => setActiveTab('start')}
        >
          📝 Mulai Ujian {exams.length > 0 && <span className="tab-counter-badge">{exams.length}</span>}
        </button>
        <button
          type="button"
          className={`home-tab-pill ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          🎓 Cek Nilai Mahasiswa
        </button>
      </div>

      {/* TAB 1: MULAI UJIAN */}
      {activeTab === 'start' && (
        <>
          {exams.length > 0 ? (
            <>
              {/* Quick Guideline Cards */}
              <div className="guideline-grid">
                <div className="guideline-card">
                  <div className="guideline-icon">⏱️</div>
                  <div className="guideline-info">
                    <strong>60 Menit</strong>
                    <span>Waktu Pengerjaan</span>
                  </div>
                </div>
                <div className="guideline-card">
                  <div className="guideline-icon">📝</div>
                  <div className="guideline-info">
                    <strong>Acak Soal</strong>
                    <span>Urutan Soal Unik</span>
                  </div>
                </div>
                <div className="guideline-card">
                  <div className="guideline-icon">💾</div>
                  <div className="guideline-info">
                    <strong>Auto-Save</strong>
                    <span>Jawaban Tersimpan Otomatis</span>
                  </div>
                </div>
              </div>

              {/* Form Input Peserta */}
              <form className="panel start-panel" onSubmit={handleStart}>
                <div className="panel-header-row">
                  <div>
                    <span className="eyebrow">Formulir Peserta Ujian</span>
                    <h2>Masukkan Data Diri</h2>
                  </div>
                  <button
                    type="button"
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                  >
                    {theme === 'dark' ? '☀️ Mode Terang' : '🌙 Mode Gelap'}
                  </button>
                </div>

                <div className="field-grid">
                  <label className="field full-width">
                    <span>Mata Kuliah Ujian</span>
                    <div className="select-wrapper">
                      <select
                        value={selectedExamId}
                        onChange={(event) => setSelectedExamId(event.target.value)}
                        className="input-elevated"
                      >
                        <option value="">-- Pilih Mata Kuliah --</option>
                        {exams.map((exam) => (
                          <option key={exam.id} value={exam.id}>
                            {exam.course_name || exam.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    {activeExam?.description && (
                      <p className="field-hint">📌 {activeExam.description}</p>
                    )}
                  </label>

                  <label className="field">
                    <span>Nomor Induk Mahasiswa (NIM)</span>
                    <input
                      value={nim}
                      onChange={(event) => setNim(event.target.value)}
                      placeholder="Contoh: 202615014"
                      className="input-elevated"
                      autoComplete="off"
                    />
                  </label>

                  <label className="field">
                    <span>Nama Lengkap Mahasiswa</span>
                    <input
                      value={studentName}
                      onChange={(event) => setStudentName(event.target.value)}
                      placeholder="Contoh: Budi Prasetyo"
                      className="input-elevated"
                      autoComplete="name"
                    />
                  </label>

                  <label className="field full-width">
                    <span>Nomor WhatsApp Aktif</span>
                    <input
                      value={whatsapp}
                      onChange={(event) => setWhatsapp(event.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="input-elevated"
                      autoComplete="tel"
                    />
                    <p className="field-hint">Untuk pencatatan rekapitulasi data hasil ujian resmi.</p>
                  </label>
                </div>

                {error && (
                  <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-submit-row">
                  <button type="submit" className="button button-primary button-large" disabled={loading}>
                    {loading ? (
                      <span className="button-loading">
                        <span className="spinner" /> Menyiapkan Lembar Ujian...
                      </span>
                    ) : (
                      'Mulai Ujian Sekarang ➔'
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Closed Session Academic State */
            <div className="panel empty-exam-card">
              <div className="empty-exam-icon-circle">🔒</div>
              <h2 className="empty-exam-title">Sesi Ujian Sedang Ditutup</h2>
              <p className="empty-exam-desc">
                Saat ini belum ada sesi ujian yang sedang dibuka atau jadwal pelaksanaan ujian telah berakhir. Pengerjaan soal hanya dapat diakses pada jam ujian resmi yang ditentukan oleh Dosen Pengampu.
              </p>
              <div className="empty-exam-callout">
                <p>
                  Bagi mahasiswa yang telah menyelesaikan ujian sebelumnya dan ingin melihat rekapitulasi nilai atau mencetak sertifikat ujian resmi, silakan buka menu <strong>Cek Nilai Mahasiswa</strong>.
                </p>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setActiveTab('results')}
                >
                  🔍 Buka Menu Cek Nilai ➔
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: CEK NILAI MAHASISWA */}
      {activeTab === 'results' && (
        <div className="panel results-search-panel">
          <div className="panel-header-row">
            <div>
              <span className="eyebrow">Portal Rekapitulasi Nilai</span>
              <h2>Cek Nilai &amp; Sertifikat Ujian</h2>
            </div>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {theme === 'dark' ? '☀️ Mode Terang' : '🌙 Mode Gelap'}
            </button>
          </div>

          <p className="results-search-desc">
            Masukkan Nomor Induk Mahasiswa (NIM) Anda untuk melihat seluruh riwayat nilai ujian yang telah Anda selesaikan dan mengunduh lembar sertifikat resmi.
          </p>

          <form onSubmit={handleSearch} className="results-search-form">
            <div className="results-search-input-group">
              <input
                type="text"
                value={searchNim}
                onChange={(e) => setSearchNim(e.target.value)}
                placeholder="Masukkan NIM Anda (contoh: 202615014)"
                className="input-elevated search-nim-input"
                autoComplete="off"
              />
              <button
                type="submit"
                className="button button-primary search-submit-btn"
                disabled={searching}
              >
                {searching ? (
                  <span className="button-loading">
                    <span className="spinner" /> Mencari...
                  </span>
                ) : (
                  '🔍 Cari Nilai Saya'
                )}
              </button>
            </div>
          </form>

          {searchError && (
            <div className="error-banner" style={{ marginTop: 16 }}>
              <span className="error-icon">⚠️</span>
              <span>{searchError}</span>
            </div>
          )}

          {searched && (
            <div className="results-output-section">
              {foundAttempts.length > 0 ? (
                <div className="found-results-wrap">
                  <div className="found-results-header">
                    <span>
                      ✅ Ditemukan <strong>{foundAttempts.length}</strong> hasil ujian atas nama{' '}
                      <strong>{foundAttempts[0].student_name}</strong> (NIM: {foundAttempts[0].nim}):
                    </span>
                  </div>

                  <div className="found-attempts-grid">
                    {foundAttempts.map((attempt) => {
                      const grade = getGradeBadge(attempt.percentage);
                      return (
                        <div key={attempt.id} className="attempt-result-card">
                          <div className="attempt-card-top">
                            <span className="attempt-course-badge">📖 {attempt.course_name}</span>
                            <span className="attempt-status-pill">Selesai</span>
                          </div>

                          <div className="attempt-card-body">
                            <div className="attempt-date-row">
                              <span className="attempt-date-label">Waktu Pengumpulan:</span>
                              <strong className="attempt-date-val">{formatSubmitDate(attempt.submitted_at)}</strong>
                            </div>

                            <div className="attempt-score-row">
                              <div className="score-mini-pill">
                                <span className="score-mini-label">Skor:</span>
                                <strong className="score-mini-val">
                                  {attempt.score} / {attempt.total_points}
                                </strong>
                                <span className="score-mini-percent">({attempt.percentage}%)</span>
                              </div>
                              <span className="grade-mini-tag" style={{ backgroundColor: grade.color }}>
                                Grade {grade.grade} ({grade.status})
                              </span>
                            </div>
                          </div>

                          <div className="attempt-card-actions">
                            <a
                              href={`/results/${attempt.id}`}
                              className="button button-finish full-width"
                            >
                              📄 Buka Lembar Nilai &amp; Sertifikat ➔
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="not-found-banner">
                  <div className="not-found-icon">ℹ️</div>
                  <div className="not-found-text">
                    <strong>Tidak ditemukan riwayat ujian untuk NIM &quot;{searchNim}&quot;</strong>
                    <p>
                      Pastikan Anda memasukkan NIM dengan benar dan ujian untuk mata kuliah terkait telah dikumpulkan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
