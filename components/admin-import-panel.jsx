'use client';

import { useState } from 'react';

export default function AdminImportPanel({ hasSupabase }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleImport() {
    setBusy(true);
    setStatus('');

    const response = await fetch('/api/admin/import', { method: 'POST' });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || 'Import gagal.');
      setBusy(false);
      return;
    }

    setStatus(`Import selesai. Bank: ${payload.bank.title}, soal: ${payload.questionCount}.`);
    setBusy(false);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="eyebrow">Import Markdown</span>
        <h2>Sinkronkan bank soal ke Supabase</h2>
      </div>
      <p className="muted">
        {hasSupabase
          ? 'Tombol ini akan membaca file bank-soal-rpl-online.md lalu mengisi question_banks, questions, options, dan exams.'
          : 'Supabase belum dikonfigurasi. Jalankan import setelah env variable diisi.'}
      </p>
      <button className="button primary" onClick={handleImport} disabled={busy || !hasSupabase}>
        {busy ? 'Mengimpor...' : 'Import bank soal'}
      </button>
      {status ? <p className="status-line">{status}</p> : null}
    </section>
  );
}

