'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = String(safe % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

export default function ExamRunner({ examId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function start() {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/exams/${examId}/start`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) {
        if (mounted) {
          setError(payload.message || 'Gagal memulai ujian.');
          setLoading(false);
        }
        return;
      }
      if (mounted) {
        setAttempt(payload.attempt);
        setAnswers(payload.initialAnswers || {});
        setLoading(false);
      }
    }

    start();

    return () => {
      mounted = false;
    };
  }, [examId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!attempt?.endsAt) {
      return 0;
    }
    return Math.max(0, Math.floor((new Date(attempt.endsAt).getTime() - now) / 1000));
  }, [attempt?.endsAt, now]);

  useEffect(() => {
    if (attempt && remainingSeconds === 0 && !submitted) {
      void handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, remainingSeconds, submitted]);

  function updateAnswer(questionId, label, type) {
    setAnswers((current) => {
      const next = { ...current };
      if (type === 'single') {
        next[questionId] = [label];
        return next;
      }

      const existing = new Set(current[questionId] || []);
      if (existing.has(label)) {
        existing.delete(label);
      } else {
        existing.add(label);
      }
      next[questionId] = [...existing];
      return next;
    });
  }

  async function handleSubmit(auto = false) {
    if (!attempt || submitting || submitted) {
      return;
    }

    setSubmitting(true);
    const response = await fetch(`/api/attempts/${attempt.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.message || 'Gagal mengirim jawaban.');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    router.push(`/results/${payload.attempt.id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <section className="panel">
        <p className="muted">Menyiapkan sesi ujian...</p>
      </section>
    );
  }

  if (error && !attempt) {
    return <section className="panel error-panel">{error}</section>;
  }

  return (
    <section className="exam-shell">
      <aside className="exam-sidebar panel">
        <span className="eyebrow">Sesi Ujian</span>
        <h1>{attempt?.exam?.course_name || attempt?.exam?.title || 'Ujian'}</h1>
        <p>{attempt?.exam?.description}</p>

        <div className="timer-box">
          <span>Sisa waktu</span>
          <strong className={remainingSeconds < 300 ? 'timer-danger' : ''}>{formatTime(remainingSeconds)}</strong>
        </div>

        <div className="stack">
          <button className="button primary" onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
          </button>
          <button className="button ghost" onClick={() => router.push('/exams')}>
            Kembali ke daftar
          </button>
        </div>
      </aside>

      <div className="exam-content">
        {attempt?.questions?.map((question) => (
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
