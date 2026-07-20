'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GuestStartForm({ examId }) {
  const router = useRouter();
  const [nim, setNim] = useState('');
  const [studentName, setStudentName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [theme, setTheme] = useState('dark');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleStart(event) {
    event.preventDefault();
    setError('');

    if (!nim.trim() || !studentName.trim() || !whatsapp.trim()) {
      setError('NIM, nama, dan WhatsApp wajib diisi.');
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/exams/${examId}/start`, {
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
          <select value={theme} onChange={(event) => setTheme(event.target.value)}>
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
