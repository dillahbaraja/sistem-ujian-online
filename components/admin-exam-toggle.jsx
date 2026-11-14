'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminExamToggle({ examId, initialPublished, courseName }) {
  const router = useRouter();
  const [published, setPublished] = useState(Boolean(initialPublished));
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const actionLabel = published ? 'mengunci' : 'membuka';
    const confirmMsg = `Apakah Anda yakin ingin ${actionLabel} akses untuk mata kuliah "${courseName}"?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/exams/${examId}/toggle`, {
        method: 'POST'
      });

      const payload = await response.json();
      if (!response.ok) {
        alert(payload.message || 'Gagal mengubah status akses mata kuliah.');
        setLoading(false);
        return;
      }

      setPublished(payload.exam.published);
      router.refresh();
    } catch {
      alert('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 999,
          fontSize: '0.82rem',
          fontWeight: 700,
          background: published ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          color: published ? '#059669' : '#dc2626',
          border: `1px solid ${published ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}
      >
        {published ? '🟢 Terbuka (Aktif)' : '🔒 Terkunci (Tutup)'}
      </span>

      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="button"
        style={{
          padding: '6px 14px',
          fontSize: '0.82rem',
          borderRadius: 10,
          background: published ? 'rgba(239, 68, 68, 0.08)' : 'rgba(14, 165, 233, 0.1)',
          borderColor: published ? 'rgba(239, 68, 68, 0.3)' : 'rgba(14, 165, 233, 0.3)',
          color: published ? '#dc2626' : '#0284c7',
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer'
        }}
        title={published ? 'Klik untuk mengunci agar tidak tampil di halaman depan mahasiswa' : 'Klik untuk membuka agar mahasiswa bisa memilih ujian ini'}
      >
        {loading ? 'Menyimpan...' : published ? '🔒 Kunci Akses' : '🔓 Buka Akses'}
      </button>
    </div>
  );
}
