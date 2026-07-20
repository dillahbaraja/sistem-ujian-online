import './globals.css';

export const metadata = {
  title: 'Sistem Ujian Online RPL',
  description: 'Web ujian online berbasis Next.js, Supabase, dan Vercel.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <div className="brand" aria-label="Ujian Online RPL">
            <span className="brand-mark" />
            <span className="brand-name">
              <strong>Ujian Online RPL</strong>
            </span>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
