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
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setSelectedExamId(examId ?? exams[0]?.id ?? '');
  }, [examId, exams]);

  function handleThemeChange(nextTheme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  async function handleStart(event) {
    event.preventDefault();
    setError('');

    if (!nim.trim() || !studentName.trim() || !whatsapp.trim()) {
      setError('NIM, nama, dan WhatsApp wajib diisi.');
      return;
    }

    setLoading(true);
    if (!selectedExamId) {
      setError('Silakan pilih mata kuliah terlebih dahulu.');
      setLoading(false);
      return;
    }

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

    router.push(`/attempts/${payload.attempt.id}`);
    router.refresh();
  }

  return (
    <form className="panel start-panel" onSubmit={handleStart}>
      <div className="field-grid">
        <label className="field">
          <span>Mata Kuliah</span>
          <select value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)}>
            <option value="">Pilih mata kuliah</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.course_name || exam.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>NIM</span>
          <input value={nim} onChange={(event) => setNim(event.target.value)} placeholder="23012345" />
        </label>
        <label className="field">
          <span>Nama</span>
          <input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Nama lengkap" />
        </label>
        <label className="field">
          <span>WhatsApp</span>
          <input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="08xxxxxxxxxx" />
        </label>
        <label className="field">
          <span>Tema</span>
          <select value={theme} onChange={(event) => handleThemeChange(event.target.value)}>
            <option value="dark">Dark mode</option>
            <option value="light">Light mode</option>
          </select>
        </label>
      </div>

      {error ? <p className="error-box">{error}</p> : null}

      <div className="stack">
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Memulai...' : 'Mulai ujian'}
        </button>
      </div>
    </form>
  );
}
