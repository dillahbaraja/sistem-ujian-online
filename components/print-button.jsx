'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      className="button button-secondary"
      onClick={() => window.print()}
    >
      🖨️ Cetak / Simpan Hasil
    </button>
  );
}
