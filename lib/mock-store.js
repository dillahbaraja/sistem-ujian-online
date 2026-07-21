import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const GUEST_EXAM_DURATION_MINUTES = 60;
import { parseMarkdownBank } from './markdown.js';
import { seededShuffle } from './shuffle.js';

function createDemoUsers() {
  return [
    {
      id: 'demo-admin',
      username: 'admin',
      full_name: 'Admin Ujian',
      role: 'admin',
      password_hash: bcrypt.hashSync('admin123', 10),
      is_active: true
    },
    {
      id: 'demo-student',
      username: 'student',
      full_name: 'Mahasiswa Demo',
      role: 'student',
      password_hash: bcrypt.hashSync('student123', 10),
      is_active: true
    }
  ];
}

function buildCatalog(bank) {
  return {
    bank: {
      id: 'bank-rpl',
      slug: bank.slug,
      title: bank.title,
      description: `${bank.program} ${bank.course}`.trim(),
      source_path: 'bank-soal-rpl-online.md',
      total_questions: bank.totalQuestions
    },
    exam: {
      id: 'exam-rpl-semester-ii',
      slug: 'rpl-semester-ii',
      title: bank.title,
      description: 'Ujian online RPL untuk semester II',
      duration_minutes: 60,
      shuffle_questions: true,
      shuffle_options: true,
      published: true,
      bank_id: 'bank-rpl'
    }
  };
}

async function createInitialState() {
  const bank = await parseMarkdownBank();
  const catalog = buildCatalog(bank);
  return {
    users: createDemoUsers(),
    bank,
    catalog,
    attempts: new Map()
  };
}

const globalStore = globalThis;

if (!globalStore.__UJIAN_ONLINE_MOCK__) {
  globalStore.__UJIAN_ONLINE_MOCK__ = await createInitialState();
}

export function getMockStore() {
  return globalStore.__UJIAN_ONLINE_MOCK__;
}

export function getMockUsers() {
  return getMockStore().users;
}

export function getMockExamCatalog() {
  return getMockStore().catalog;
}

export function getMockQuestions() {
  return getMockStore().bank.questions;
}

export function findMockUser(username) {
  return getMockUsers().find((user) => user.username === username);
}

export function authenticateMockUser(username, password) {
  const user = findMockUser(username);
  if (!user) {
    return null;
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return null;
  }

  return user;
}

function toClientQuestion(question, seed) {
  const options = seededShuffle(question.options, `${seed}:${question.id}`);
  return {
    id: question.id,
    number: question.number,
    type: question.type,
    stem: question.stem,
    explanation: question.explanation,
    options
  };
}

export function startMockAttempt(user, examId) {
  const store = getMockStore();
  const exam = store.catalog.exam;
  if (exam.id !== examId) {
    return null;
  }

  const existing = [...store.attempts.values()].find(
    (attempt) => attempt.userId === user.id && attempt.examId === examId && attempt.status === 'in_progress'
  );
  if (existing) {
    return existing;
  }

  const attemptId = `attempt-${crypto.randomUUID()}`;
  const startedAt = new Date().toISOString();
  const orderedQuestions = seededShuffle(store.bank.questions, `${attemptId}:questions`).map((question) =>
    toClientQuestion(question, attemptId)
  );
  const durationMinutes = GUEST_EXAM_DURATION_MINUTES;
  const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const attempt = {
    id: attemptId,
    examId,
    userId: user.id,
    startedAt,
    endsAt,
    durationMinutes,
    status: 'in_progress',
    orderedQuestions,
    score: null,
    totalPoints: null,
    percentage: null,
    submittedAt: null,
    answers: {}
  };
  store.attempts.set(attemptId, attempt);
  return attempt;
}

export function getMockExam(examId) {
  const exam = getMockStore().catalog.exam;
  if (exam.id !== examId) {
    return null;
  }
  return exam;
}

export function listMockExams() {
  return [getMockStore().catalog.exam];
}

export function getMockAttempt(attemptId) {
  return getMockStore().attempts.get(attemptId) ?? null;
}

export function deleteMockAttempt(attemptId) {
  return getMockStore().attempts.delete(attemptId);
}

function isAnswerCorrect(correctLabels, selectedLabels) {
  const correct = [...correctLabels].sort().join('|');
  const selected = [...selectedLabels].sort().join('|');
  return correct === selected;
}

export function submitMockAttempt(attemptId, payload) {
  const attempt = getMockAttempt(attemptId);
  if (!attempt) {
    return null;
  }
  if (attempt.status === 'submitted') {
    return attempt;
  }

  const questions = getMockQuestions();
  const answers = payload.answers ?? {};
  let score = 0;
  let totalPoints = questions.length;

  const scoredAnswers = questions.map((question) => {
    const selected = Array.isArray(answers[question.id]) ? answers[question.id] : [];
    const correct = question.answerLabels ?? [];
    const correctFlag = isAnswerCorrect(correct, selected);
    if (correctFlag) {
      score += 1;
    }

    return {
      questionId: question.id,
      selectedLabels: selected,
      correctLabels: correct,
      isCorrect: correctFlag,
      points: correctFlag ? 1 : 0
    };
  });

  const percentage = totalPoints ? Number(((score / totalPoints) * 100).toFixed(2)) : 0;
  const submittedAt = new Date().toISOString();
  const updated = {
    ...attempt,
    status: 'submitted',
    submittedAt,
    score,
    totalPoints,
    percentage,
    scoredAnswers,
    answers
  };
  getMockStore().attempts.set(attemptId, updated);
  return updated;
}

export function getMockSummary() {
  const store = getMockStore();
  const attempts = [...store.attempts.values()];
  return {
    bank: store.bank,
    examCount: 1,
    questionCount: store.bank.questions.length,
    attemptCount: attempts.length,
    submittedCount: attempts.filter((attempt) => attempt.status === 'submitted').length,
    recentAttempts: attempts.slice(-8).reverse()
  };
}
