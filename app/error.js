'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  const isDatabaseError =
    error?.message?.includes('fetch failed') ||
    error?.message?.includes('ENOTFOUND') ||
    error?.message?.includes('database');

  return (
    <section className="hero simple-hero">
      <div className="hero-card">
        <div className="panel compact-panel" style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⚠️</div>
          <h2 style={{ color: '#ef4444', marginBottom: 8 }}>
            {isDatabaseError ? 'Koneksi Database Terputus' : 'Terjadi Kesalahan Server'}
          </h2>
          <p className="muted" style={{ marginBottom: 16, lineHeight: 1.6, fontSize: '0.92rem' }}>
            {isDatabaseError ? (
              <>
                Server tidak dapat terhubung ke database Supabase. Jika menggunakan paket gratis, proyek Supabase kemungkinan sedang <strong>ditangguhkan (Paused)</strong> karena tidak ada aktivitas selama beberapa waktu.
                <br />
                Silakan buka dashboard Supabase dan klik <strong>Restore / Unpause</strong>, lalu muat ulang halaman.
              </>
            ) : (
              'Maaf, terjadi gangguan sementara pada sistem. Silakan muat ulang halaman.'
            )}
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button
              type="button"
              className="button button-primary"
              onClick={() => (reset ? reset() : window.location.reload())}
            >
              Muat Ulang Halaman
            </button>
            <a href="/" className="button button-secondary">
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
