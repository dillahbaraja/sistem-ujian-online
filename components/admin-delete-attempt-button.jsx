'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminDeleteAttemptButton({ attemptId, studentName }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`Hapus data ${studentName || 'peserta'}?`);
    if (!confirmed) {
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/admin/attempts/${attemptId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      className="icon-button danger"
      onClick={handleDelete}
      disabled={loading}
      aria-label={`Hapus data ${studentName || 'peserta'}`}
      title="Hapus data"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9 3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V4h4a.75.75 0 0 1 0 1.5h-1.06l-.7 11.05A2.25 2.25 0 0 1 15 18.75H9a2.25 2.25 0 0 1-2.24-2.2L6.06 5.5H5a.75.75 0 0 1 0-1.5h4v-.25Zm1.5.25v-.25c0-.14.11-.25.25-.25h2.5c.14 0 .25.11.25.25V4h-3Zm-1.18 1.5.63 10.96c.02.41.36.74.78.74h4.54c.41 0 .76-.33.78-.74L16.68 5.5H9.32ZM10 8.25c.41 0 .75.34.75.75v5.5a.75.75 0 0 1-1.5 0V9c0-.41.34-.75.75-.75Zm4 0c.41 0 .75.34.75.75v5.5a.75.75 0 0 1-1.5 0V9c0-.41.34-.75.75-.75Z" />
      </svg>
    </button>
  );
}
