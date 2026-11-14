'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GuestStartForm({ exams = [], examId }) {
  const router = useRouter();
  const [nim, setNim] = useState('');
  const [studentName, setStudentName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [theme, setTheme] = useState('light');
  const [selectedExamId, setSelectedExamId] = useState(examId ?? exams[0]?.id ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const activeExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  return (
    <div className="start-container">
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
              placeholder="Contoh: 21010123"
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
    </div>
  );
}
