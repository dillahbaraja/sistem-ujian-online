import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin } from '../../../lib/auth.js';
import AdminImportPanel from '../../../components/admin-import-panel.jsx';
import { hasSupabaseConfig } from '../../../lib/supabase.js';

export const dynamic = 'force-dynamic';

export default function ImportPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (!isAdmin(user)) {
    redirect('/exams');
  }

  return (
    <section className="panel">
      <span className="eyebrow">Import Data</span>
      <h1>Import bank soal Markdown</h1>
      <p className="muted">
        File bank soal lokal akan diparsing, lalu disimpan ke question_banks, questions, options, dan exams.
      </p>
      <AdminImportPanel hasSupabase={hasSupabaseConfig()} />
    </section>
  );
}

