import { getExamList } from '../lib/storage.js';
import GuestStartForm from '../components/guest-start-form.jsx';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let exams = [];
  let dbError = null;

  try {
    exams = await getExamList();
  } catch (error) {
    console.error('Failed to load exams on HomePage:', error);
    dbError = error;
  }

  return (
    <section className="hero simple-hero">
      <div className="hero-card">
        <div className="hero-header-row">
          <div className="hero-copy">
            <h1 className="hero-title">
              <span className="hero-line hero-line-1">UJIAN ONLINE</span>
              <span className="hero-line hero-line-2">TEKNIK INFORMATIKA - FTEI</span>
              <span className="hero-line hero-line-3">UNIVERSITAS SURAKARTA</span>
            </h1>
          </div>

          <div className="hero-lecturer-badge">
            <span className="lecturer-label">Dosen Pengampu</span>
            <strong className="lecturer-name">Dr. Abdillah Baradja, S.Kom., M.Eng.</strong>
          </div>
        </div>

        <div className="hero-content">
          {dbError ? (
            <div className="panel compact-panel" style={{ marginTop: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⚠️</div>
              <h2 style={{ color: '#ef4444', marginBottom: 8 }}>Koneksi Database Terputus</h2>
              <p className="muted" style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                Server tidak dapat menghubungi database Supabase. Jika menggunakan paket gratis (Free Tier), proyek Supabase otomatis <strong>ditangguhkan (Paused)</strong> setelah 7 hari tidak ada aktivitas.
              </p>
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, fontSize: '0.85rem', color: '#b91c1c', textAlign: 'left' }}>
                <strong>Cara Mengatasi:</strong>
                <ol style={{ paddingLeft: 20, marginTop: 6, marginBottom: 0 }}>
                  <li>Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', fontWeight: 600 }}>Supabase Dashboard</a>.</li>
                  <li>Cari proyek Anda (status akan bertuliskan <em>Paused</em>).</li>
                  <li>Klik tombol <strong>&quot;Restore Project&quot;</strong> atau <strong>&quot;Unpause&quot;</strong>.</li>
                  <li>Tunggu 1-2 menit hingga status berubah hijau (Active), lalu muat ulang halaman ini.</li>
                </ol>
              </div>
              <div style={{ marginTop: 20 }}>
                <a href="/" className="button button-primary">
                  Coba Muat Ulang
                </a>
              </div>
            </div>
          ) : exams.length > 0 ? (
            <GuestStartForm exams={exams} examId={exams[0]?.id} />
          ) : (
            <div className="panel compact-panel" style={{ marginTop: 20 }}>
              <h2>Ujian belum aktif</h2>
              <p className="muted">Belum ada mata kuliah yang dipublikasikan.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
