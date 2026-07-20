'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 10;

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = String(safe % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

function chunkRange(page, total) {
  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  return [start, end];
}

function countAnswered(values) {
  return Object.values(values).filter((entry) => Array.isArray(entry) && entry.length > 0).length;
}

function progressNumber(questions, answers, page) {
  const [start, end] = chunkRange(page, questions.length);
  const current = questions.slice(start, end);
  const answered = current.filter((question) => Array.isArray(answers[question.id]) && answers[question.id].length > 0);
  if (answered.length === 0) {
    return 0;
  }
  return answered[answered.length - 1].number;
}

export default function GuestExamRunner({ attempt, exam, questions, answers: initialAnswers }) {
  const router = useRouter();
  const [page, setPage] = useState(attempt.current_page || 1);
  const [answers, setAnswers] = useState(initialAnswers || {});
  const [theme, setTheme] = useState(attempt.theme || 'dark');
  const [now, setNow] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    return () => {
      root.dataset.theme = '';
    };
  }, [theme]);

  const remainingSeconds = useMemo(() => {
    if (!attempt?.ends_at) {
      return 0;
    }
    return Math.max(0, Math.floor((new Date(attempt.ends_at).getTime() - now) / 1000));
  }, [attempt?.ends_at, now]);

  const [pageStart, pageEnd] = chunkRange(page, questions.length);
  const pageQuestions = questions.slice(pageStart, pageEnd);
  const allAnswered = pageQuestions.every((question) => (answers[question.id] || []).length > 0);
  const allQuestionsAnswered = countAnswered(answers) === questions.length;
  const answeredCount = countAnswered(answers);

  useEffect(() => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      void saveProgress();
    }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, page, theme]);

  useEffect(() => {
    if (remainingSeconds === 0 && allQuestionsAnswered && !submitting) {
      void handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, allQuestionsAnswered]);

  async function saveProgress(nextAnswers = answers, nextPage = page, nextTheme = theme) {
    setSaving(true);
    const response = await fetch(`/api/attempts/${attempt.id}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answersByQuestionId: nextAnswers,
        currentPage: nextPage,
        progressQuestionNumber: progressNumber(questions, nextAnswers, nextPage),
        answeredCount: countAnswered(nextAnswers),
        totalQuestions: questions.length,
        theme: nextTheme
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.message || 'Gagal menyimpan progres.');
    }
    setSaving(false);
  }

  function updateAnswer(questionId, label, type) {
    setError('');
    setAnswers((current) => {
      const next = { ...current };
      if (type === 'single') {
        next[questionId] = [label];
      } else {
        const existing = new Set(current[questionId] || []);
        if (existing.has(label)) {
          existing.delete(label);
        } else {
          existing.add(label);
        }
        next[questionId] = [...existing];
      }
      void saveProgress(next, page, theme);
      return next;
    });
  }

  async function handleNext() {
    if (!allAnswered) {
      setError(`Semua soal pada halaman ${page} harus dijawab dulu.`);
      return;
    }

    await saveProgress(answers, page, theme);
    if (page < Math.ceil(questions.length / PAGE_SIZE)) {
      setPage((current) => current + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    await handleSubmit();
  }

  async function handleSubmit() {
    if (!allQuestionsAnswered) {
      setError('Semua soal harus dijawab sebelum submit.');
      return;
    }

    setSubmitting(true);
    const response = await fetch(`/api/attempts/${attempt.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answersByQuestionId: answers })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.message || 'Gagal mengirim jawaban.');
      setSubmitting(false);
      return;
    }

    router.push(`/results/${payload.attempt.id}`);
    router.refresh();
  }

  return (
    <section className="exam-shell" data-theme={theme}>
      <aside className="exam-sidebar panel">
        <div className="exam-meta">
          <div className="exam-meta-row">
            <span className="exam-meta-label">NIM:</span>
            <strong className="exam-meta-value">{attempt.nim}</strong>
          </div>
          <div className="exam-meta-row">
            <span className="exam-meta-label">Nama:</span>
            <strong className="exam-meta-value">{attempt.student_name}</strong>
          </div>
        </div>

        <div className="mini-grid">
          <div className="mini-stat">
            <span>Waktu</span>
            <strong className={remainingSeconds < 300 ? 'timer-danger' : ''}>{formatTime(remainingSeconds)}</strong>
          </div>
          <div className="mini-stat">
            <span>Terjawab</span>
            <strong>{answeredCount}/{questions.length}</strong>
          </div>
          <div className="mini-stat">
            <span>Halaman</span>
            <strong>{page}/{Math.ceil(questions.length / PAGE_SIZE)}</strong>
          </div>
          <div className="mini-stat">
            <span>Tema</span>
            <strong>{theme}</strong>
          </div>
        </div>

        <label className="field">
          <span>Tema</span>
          <select value={theme} onChange={(event) => setTheme(event.target.value)}>
            <option value="dark">Dark mode</option>
            <option value="light">Light mode</option>
          </select>
        </label>

        <div className="stack">
          <button className="button primary" type="button" onClick={handleNext} disabled={saving || submitting}>
            {page < Math.ceil(questions.length / PAGE_SIZE) ? 'Next' : 'Kirim Jawaban'}
          </button>
        </div>

        {error ? <p className="error-box" style={{ marginTop: 12 }}>{error}</p> : null}
      </aside>

      <div className="exam-content">
        <div className="panel page-header">
          <h2>Soal {pageStart + 1}-{pageEnd}</h2>
        </div>

        {pageQuestions.map((question) => (
          <article key={question.id} className="panel question-card">
            <div className="question-head">
              <span className="pill">Soal {question.number}</span>
              <span className="pill subtle">{question.type === 'multi' ? 'Multi-select' : 'Pilihan tunggal'}</span>
            </div>
            <h2>{question.stem}</h2>

            <div className="options-grid">
              {question.options.map((option) => {
                const selected = (answers[question.id] || []).includes(option.label);
                return (
                  <button
                    key={option.label}
                    type="button"
                    className={`option-button ${selected ? 'selected' : ''}`}
                    onClick={() => updateAnswer(question.id, option.label, question.type)}
                  >
                    <span className="option-label">{option.label}</span>
                    <span>{option.text}</span>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
