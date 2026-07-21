import Image from 'next/image';
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
          <div className="topbar-sponsor" aria-label="Universitas Surakarta">
            <Image src="/unsa_logo.png" alt="UNSA" width={40} height={40} priority />
            <Image src="/white_logo_unsa.png" alt="Universitas Surakarta" width={118} height={36} priority />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
