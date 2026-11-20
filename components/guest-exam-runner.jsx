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

function highlightJava(code) {
  const keywords = new Set([
    'public', 'private', 'protected', 'class', 'void', 'static', 'final',
    'new', 'return', 'int', 'double', 'boolean', 'char', 'float', 'import',
    'package', 'this', 'super', 'if', 'else', 'for', 'while', 'do', 'switch',
    'case', 'break', 'continue', 'try', 'catch', 'throw', 'throws'
  ]);

  const tokenRegex = /(\/\/.*|"(?:[^"\\]|\\.)*"|[a-zA-Z_][a-zA-Z0-9_]*|[^a-zA-Z_0-9"\s]+|\s+)/g;
  
  const tokens = [];
  let match;
  while ((match = tokenRegex.exec(code)) !== null) {
    tokens.push(match[0]);
  }

  return tokens.map((token, index) => {
    if (token.startsWith('//')) {
      return <span key={index} className="token-comment">{token}</span>;
    }
    if (token.startsWith('"')) {
      return <span key={index} className="token-string">{token}</span>;
    }
    if (keywords.has(token)) {
      return <span key={index} className="token-keyword">{token}</span>;
    }
    if (/^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
      return <span key={index} className="token-class">{token}</span>;
    }
    if (/^[0-9]+$/.test(token)) {
      return <span key={index} className="token-number">{token}</span>;
    }
    return token;
  });
}

function renderTextWithInlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="inline-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function RichText({ text }) {
  if (!text) return null;

  const parts = text.split('```');
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          let lang = '';
          let code = part;
          const match = part.match(/^([a-zA-Z0-9_-]+)\n/);
          if (match) {
            lang = match[1];
            code = part.slice(match[0].length);
          }
          code = code.trimEnd();

          return (
            <pre key={index} className={`code-block ${lang}`}>
              <code>{lang === 'java' ? highlightJava(code) : code}</code>
            </pre>
          );
        } else {
          const trimmedPart = part.replace(/^\n+|\n+$/g, '');
          if (!trimmedPart) return null;

          const lines = trimmedPart.split('\n');
          return lines.map((line, lineIndex) => {
            const content = renderTextWithInlineMarkdown(line);
            return (
              <span key={`${index}-${lineIndex}`} className="text-line">
                {content}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            );
          });
        }
      })}
    </>
  );
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
  const draftKey = `rpl-exam-draft:${attempt.id}`;
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftState, setDraftState] = useState(null);

  function readDraft() {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(draftKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeDraft(nextAnswers, nextPage, nextTheme) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({
          answers: nextAnswers,
          page: nextPage,
          theme: nextTheme
        })
      );
    } catch {
      // Ignore storage quota or privacy mode failures.
    }
  }

  function clearDraft() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Ignore storage failures.
    }
  }

  const [page, setPage] = useState(attempt.current_page || 1);
  const [answers, setAnswers] = useState(initialAnswers || {});
  const [theme, setTheme] = useState(attempt.theme || 'light');
  const [now, setNow] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [error, setError] = useState('');
  const saveTimer = useRef(null);
  const isSavingRef = useRef(false);
  const nextSaveRef = useRef(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    writeDraft(answers, page, nextTheme);
  }

  useEffect(() => {
    const draft = readDraft();
    if (!draft) {
      setDraftLoaded(true);
      return;
    }

    setDraftState(draft);
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded || !draftState) {
      return;
    }

    if (draftState.answers) {
      setAnswers(draftState.answers);
    }
    if (draftState.page) {
      setPage(draftState.page);
    }
    if (draftState.theme) {
      setTheme(draftState.theme);
    }
  }, [draftLoaded, draftState]);

  const remainingSeconds = useMemo(() => {
    if (!attempt?.ends_at) {
      return 0;
    }
    return Math.max(0, Math.floor((new Date(attempt.ends_at).getTime() - now) / 1000));
  }, [attempt?.ends_at, now]);

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const [pageStart, pageEnd] = chunkRange(page, questions.length);
  const pageQuestions = questions.slice(pageStart, pageEnd);
  const allAnswered = pageQuestions.every((question) => (answers[question.id] || []).length > 0);
  const answeredCount = countAnswered(answers);
  const allQuestionsAnswered = answeredCount === questions.length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  useEffect(() => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      void queueProgressSave();
    }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, page, theme]);

  useEffect(() => {
    writeDraft(answers, page, theme);
  }, [answers, page, theme]);

  useEffect(() => {
    if (remainingSeconds === 0 && !submitting) {
      void executeSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  async function persistProgress(nextAnswers = answers, nextPage = page, nextTheme = theme) {
    writeDraft(nextAnswers, nextPage, nextTheme);

    if (isSavingRef.current) {
      nextSaveRef.current = { answers: nextAnswers, page: nextPage, theme: nextTheme };
      return;
    }

    isSavingRef.current = true;
    setSaving(true);

    try {
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
    } catch (err) {
      console.warn('Background save interrupted, will retry:', err);
    } finally {
      isSavingRef.current = false;
      setSaving(false);
      if (nextSaveRef.current) {
        const queued = nextSaveRef.current;
        nextSaveRef.current = null;
        void persistProgress(queued.answers, queued.page, queued.theme);
      }
    }
  }

  function queueProgressSave(nextAnswers = answers, nextPage = page, nextTheme = theme) {
    void persistProgress(nextAnswers, nextPage, nextTheme);
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
      writeDraft(next, page, theme);
      return next;
    });
  }

  function handleNext() {
    if (!allAnswered) {
      setError(`Mohon jawab semua soal pada halaman ${page} sebelum berpindah halaman.`);
      return;
    }

    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      void persistProgress(answers, nextPage, theme);
      return;
    }

    // On last page, prompt submit modal
    setShowSubmitModal(true);
  }

  function handleBack() {
    if (page <= 1) {
      return;
    }

    const prevPage = page - 1;
    setPage(prevPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void persistProgress(answers, prevPage, theme);
  }

  function jumpToQuestion(index) {
    const targetPage = Math.floor(index / PAGE_SIZE) + 1;
    if (targetPage !== page) {
      setPage(targetPage);
    }
    const targetId = questions[index]?.id;
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }

  async function executeSubmit() {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answersByQuestionId: answers })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Gagal mengirim jawaban.');
        setSubmitting(false);
        setShowSubmitModal(false);
        return;
      }

      clearDraft();
      router.push(`/results/${payload.attempt.id}`);
      router.refresh();
    } catch {
      setError('Gagal mengirim jawaban karena gangguan jaringan. Coba lagi.');
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  }

  return (
    <section className="exam-shell" data-theme={theme}>
      {/* Top Floating Exam Navbar */}
      <header className="exam-topbar">
        <div className="exam-topbar-left">
          <span className="exam-title-badge">📖 {exam.course_name || exam.title}</span>
          <span className="exam-student-badge">👤 {attempt.nim} - {attempt.student_name}</span>
        </div>

        <div className="exam-topbar-right">
          <div className={`timer-badge ${remainingSeconds < 600 ? 'timer-alert' : ''}`}>
            <span className="timer-icon">⏳</span>
            <span className="timer-countdown">{formatTime(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            className="theme-toggle-icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="exam-layout">
        {/* Left Sidebar / Palet Nomor Soal */}
        <aside className="exam-sidebar">
          {/* Progress Card */}
          <div className="sidebar-card">
            <div className="progress-header">
              <span className="progress-label">Progres Ujian</span>
              <strong className="progress-value">{answeredCount} / {questions.length}</strong>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="progress-subtext">{progressPercent}% Soal Terjawab</span>
          </div>

          {/* Question Palette Grid */}
          <div className="sidebar-card palette-card">
            <div className="palette-title-row">
              <h3>Palet Nomor Soal</h3>
              <span className="palette-page-badge">Hal {page} dari {totalPages}</span>
            </div>

            <div className="palette-grid">
              {questions.map((q, idx) => {
                const isAnswered = (answers[q.id] || []).length > 0;
                const isCurrentPage = idx >= pageStart && idx < pageEnd;

                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`palette-btn ${isAnswered ? 'answered' : 'unanswered'} ${isCurrentPage ? 'current-page' : ''}`}
                    onClick={() => jumpToQuestion(idx)}
                    title={`Lompat ke Soal ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="palette-legend">
              <div className="legend-item">
                <span className="legend-box answered" /> Sudah Dijawab
              </div>
              <div className="legend-item">
                <span className="legend-box unanswered" /> Belum Dijawab
              </div>
            </div>
          </div>

          {/* Quick Submit Button in Sidebar */}
          <div className="sidebar-card action-card">
            <button
              type="button"
              className="button button-finish full-width"
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
            >
              🏁 Selesai &amp; Kumpulkan
            </button>
          </div>
        </aside>

        {/* Center/Right Question Stream */}
        <div className="exam-content">
          <div className="content-page-header">
            <div>
              <span className="eyebrow">Halaman {page} dari {totalPages}</span>
              <h2>Soal Nomor {pageStart + 1} – {pageEnd}</h2>
            </div>
            {saving && <span className="save-status-indicator">💾 Menyimpan...</span>}
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="questions-stream">
            {pageQuestions.map((question) => {
              const currentSelected = answers[question.id] || [];
              const isMulti = question.type === 'multi';

              return (
                <article key={question.id} id={question.id} className="panel question-card">
                  <div className="question-head">
                    <span className="question-number-pill">Soal {question.number}</span>
                    <span className={`question-type-pill ${isMulti ? 'type-multi' : 'type-single'}`}>
                      {isMulti ? '☑️ Centang Semua Yang Benar' : '⭕ Pilihan Tunggal'}
                    </span>
                  </div>

                  <div className="question-stem">
                    <RichText text={question.stem} />
                  </div>

                  <div className="options-grid">
                    {question.options.map((option) => {
                      const selected = currentSelected.includes(option.label);

                      return (
                        <button
                          key={option.label}
                          type="button"
                          className={`option-button ${selected ? 'selected' : ''}`}
                          onClick={() => updateAnswer(question.id, option.label, question.type)}
                        >
                          <span className="option-label-circle">{option.label}</span>
                          <span className="option-text">
                            <RichText text={option.text} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bottom Navigation Pagination Controls */}
          <div className="bottom-nav-bar panel">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleBack}
              disabled={page <= 1 || submitting}
            >
              ← Halaman Sebelumnya
            </button>

            <span className="page-indicator-text">
              Halaman <strong>{page}</strong> / {totalPages}
            </span>

            {page < totalPages ? (
              <button
                type="button"
                className="button button-primary"
                onClick={handleNext}
                disabled={submitting}
              >
                Halaman Berikutnya →
              </button>
            ) : (
              <button
                type="button"
                className="button button-finish"
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
              >
                Kumpulkan Jawaban 🏁
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-icon">📋</span>
              <h3>Konfirmasi Selesai Ujian</h3>
            </div>

            <div className="modal-body">
              <p>
                Anda telah menjawab <strong>{answeredCount}</strong> dari total <strong>{questions.length}</strong> soal.
              </p>

              {!allQuestionsAnswered && (
                <div className="modal-warning">
                  ⚠️ <strong>Perhatian:</strong> Masih ada <strong>{questions.length - answeredCount} soal</strong> yang belum Anda jawab. Soal yang tidak dijawab akan bernilai 0 (salah).
                </div>
              )}

              <p className="modal-sub">
                Setelah lembar jawaban dikumpulkan, Anda tidak dapat mengubah jawaban lagi. Apakah Anda yakin ingin mengumpulkan sekarang?
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                Kembali Periksa
              </button>
              <button
                type="button"
                className="button button-finish"
                onClick={executeSubmit}
                disabled={submitting}
              >
                {submitting ? 'Mengirim...' : 'Ya, Kumpulkan Jawaban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
