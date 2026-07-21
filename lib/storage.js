import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { createSupabaseAdminClient, hasSupabaseConfig } from './supabase.js';
import { parseMarkdownBank } from './markdown.js';
import { deleteMockAttempt, getMockAttempt, getMockExam, getMockExamCatalog, getMockQuestions, getMockSummary, getMockStore, listMockExams, startMockAttempt, submitMockAttempt, authenticateMockUser } from './mock-store.js';
import { seededShuffle } from './shuffle.js';
import { scoreQuestions } from './scoring.js';

const GUEST_EXAM_DURATION_MINUTES = 60;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function mapDbQuestion(question, options) {
  const orderedOptions = [...options]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((option) => ({
      id: option.id,
      label: option.label,
      text: option.text
    }));

  return {
    id: question.id,
    number: question.number,
    type: question.type,
    stem: question.stem,
    explanation: question.explanation ?? '',
    correctLabels: question.correct_option_labels ?? [],
    options: orderedOptions
  };
}

function toPublicQuestion(question) {
  return {
    id: question.id,
    number: question.number,
    type: question.type,
    stem: question.stem,
    explanation: question.explanation ?? '',
    options: question.options ?? []
  };
}

async function getQuestionsFromSupabase(supabase, examId) {
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, slug, title, description, duration_minutes, shuffle_questions, shuffle_options, published, bank_id')
    .eq('id', examId)
    .maybeSingle();

  if (examError) {
    throw examError;
  }
  if (!exam) {
    return null;
  }

  const { data: questions, error: questionError } = await supabase
    .from('questions')
    .select('id, number, type, stem, explanation, correct_option_labels, bank_id')
    .eq('bank_id', exam.bank_id)
    .order('number', { ascending: true });

  if (questionError) {
    throw questionError;
  }

  const questionIds = questions.map((question) => question.id);
  const { data: options, error: optionError } = await supabase
    .from('options')
    .select('id, question_id, label, text, sort_order')
    .in('question_id', questionIds)
    .order('sort_order', { ascending: true });

  if (optionError) {
    throw optionError;
  }

  const optionMap = new Map();
  for (const option of options) {
    const list = optionMap.get(option.question_id) ?? [];
    list.push(option);
    optionMap.set(option.question_id, list);
  }

  return {
    exam,
    questions: questions.map((question) => mapDbQuestion(question, optionMap.get(question.id) ?? []))
  };
}

async function listExamsFromSupabase(supabase) {
  const { data, error } = await supabase
    .from('exams')
    .select('id, slug, title, description, duration_minutes, shuffle_questions, shuffle_options, published, bank_id')
    .eq('published', true)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getUserFromSupabase(supabase, username) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, role, password_hash, is_active')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

async function startSupabaseAttempt(supabase, user, examId) {
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, slug, title, description, duration_minutes, shuffle_questions, shuffle_options, published, bank_id')
    .eq('id', examId)
    .maybeSingle();

  if (examError) {
    throw examError;
  }
  if (!exam) {
    return null;
  }

  const { data: existingAttempt, error: existingAttemptError } = await supabase
    .from('attempts')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
    .maybeSingle();

  if (existingAttemptError) {
    throw existingAttemptError;
  }
  if (existingAttempt) {
    return existingAttempt;
  }

  const bankData = await getQuestionsFromSupabase(supabase, examId);
  if (!bankData) {
    return null;
  }

  const attemptId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + GUEST_EXAM_DURATION_MINUTES * 60 * 1000).toISOString();

  const { data: attempt, error: insertError } = await supabase
    .from('attempts')
    .insert({
      id: attemptId,
      exam_id: examId,
      user_id: user.id,
      started_at: startedAt,
      ends_at: endsAt,
      duration_minutes: exam.duration_minutes,
      status: 'in_progress',
      score: 0,
      total_points: bankData.questions.length,
      percentage: 0
    })
    .select('*')
    .single();

  if (insertError) {
    throw insertError;
  }

  const questionOrder = exam.shuffle_questions
    ? seededShuffle(bankData.questions, `${attemptId}:questions`)
    : bankData.questions;

  return {
    ...attempt,
    exam,
    questions: questionOrder.map((question) =>
      toPublicQuestion({
        ...question,
        options: exam.shuffle_options ? seededShuffle(question.options, `${attemptId}:${question.id}`) : question.options
      })
    )
  };
}

async function submitSupabaseAttempt(supabase, attemptId, answersByQuestionId) {
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, exam_id, user_id, status, started_at, ends_at, duration_minutes, score, total_points, percentage')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError) {
    throw attemptError;
  }
  if (!attempt) {
    return null;
  }
  if (attempt.status === 'submitted') {
    return getAttemptFromSupabase(supabase, attemptId);
  }

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, bank_id')
    .eq('id', attempt.exam_id)
    .maybeSingle();

  if (examError) {
    throw examError;
  }
  if (!exam) {
    return null;
  }

  const { data: questions, error: questionError } = await supabase
    .from('questions')
    .select('id, number, type, stem, explanation, correct_option_labels, bank_id')
    .eq('bank_id', exam.bank_id)
    .order('number', { ascending: true });

  if (questionError) {
    throw questionError;
  }

  const scored = scoreQuestions(
    questions.map((question) => ({
      id: question.id,
      correctLabels: question.correct_option_labels ?? []
    })),
    answersByQuestionId
  );

  const submittedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('attempts')
    .update({
      status: 'submitted',
      submitted_at: submittedAt,
      score: scored.score,
      total_points: scored.totalPoints,
      percentage: scored.percentage
    })
    .eq('id', attemptId);

  if (updateError) {
    throw updateError;
  }

  const answersPayload = scored.scoredAnswers.map((row) => ({
    attempt_id: attemptId,
    question_id: row.questionId,
    selected_option_labels: row.selectedLabels,
    correct_option_labels: row.correctLabels,
    is_correct: row.isCorrect,
    points: row.points
  }));

  await supabase.from('attempt_answers').delete().eq('attempt_id', attemptId);
  const { error: answerInsertError } = await supabase.from('attempt_answers').insert(answersPayload);
  if (answerInsertError) {
    throw answerInsertError;
  }

  return getAttemptFromSupabase(supabase, attemptId);
}

async function getAttemptFromSupabase(supabase, attemptId) {
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, exam_id, user_id, started_at, ends_at, duration_minutes, status, submitted_at, score, total_points, percentage')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError) {
    throw attemptError;
  }
  if (!attempt) {
    return null;
  }

  const { data: answers, error: answersError } = await supabase
    .from('attempt_answers')
    .select('attempt_id, question_id, selected_option_labels, correct_option_labels, is_correct, points')
    .eq('attempt_id', attemptId)
    .order('question_id', { ascending: true });

  if (answersError) {
    throw answersError;
  }

  return {
    ...attempt,
    answers: answers ?? []
  };
}

async function getSummaryFromSupabase(supabase) {
  const [
    { count: bankCount },
    { count: questionCount },
    { count: examCount },
    { count: attemptCount },
    { count: submittedCount },
    { data: recentAttempts }
  ] = await Promise.all([
    supabase.from('question_banks').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('exams').select('*', { count: 'exact', head: true }),
    supabase.from('attempts').select('*', { count: 'exact', head: true }),
    supabase.from('attempts').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase
      .from('attempts')
      .select('id, exam_id, user_id, started_at, submitted_at, status, score, total_points, percentage')
      .order('started_at', { ascending: false })
      .limit(8)
  ]);

  return {
    bankCount: bankCount ?? 0,
    questionCount: questionCount ?? 0,
    examCount: examCount ?? 0,
    attemptCount: attemptCount ?? 0,
    submittedCount: submittedCount ?? 0,
    recentAttempts: recentAttempts ?? []
  };
}

export async function getCurrentUserByCredentials(username, password) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdminClient();
    const user = await getUserFromSupabase(supabase, username);
    if (!user || !user.is_active || user.role !== 'admin') {
      return null;
    }
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    return passwordOk ? user : null;
  }

  const user = authenticateMockUser(username, password);
  return user?.role === 'admin' ? user : null;
}

export async function getExamList() {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdminClient();
    return listExamsFromSupabase(supabase);
  }

  return listMockExams();
}

export async function getExamForSession(examId) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdminClient();
    return getQuestionsFromSupabase(supabase, examId);
  }

  const exam = getMockExam(examId);
  if (!exam) {
    return null;
  }

  return {
    exam,
    questions: getMockQuestions()
  };
}

export async function startExamSession(user, examId) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdminClient();
    return startSupabaseAttempt(supabase, user, examId);
  }

  return startMockAttempt(user, examId);
}

export async function submitExamSession(attemptId, answersByQuestionId) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdminClient();
    return submitSupabaseAttempt(supabase, attemptId, answersByQuestionId);
  }

  return submitMockAttempt(attemptId, { answers: answersByQuestionId });
}

export async function getAttemptById(attemptId) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdminClient();
    return getAttemptFromSupabase(supabase, attemptId);
  }

  return getMockAttempt(attemptId);
}

export async function getSummary() {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdminClient();
    return getSummaryFromSupabase(supabase);
  }

  const summary = getMockSummary();
  return {
    bankCount: 1,
    questionCount: summary.questionCount,
    examCount: 1,
    attemptCount: summary.attemptCount,
    submittedCount: summary.submittedCount,
    recentAttempts: summary.recentAttempts
  };
}

export async function importMarkdownBankToSupabase() {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase configuration is missing.');
  }

  const supabase = createSupabaseAdminClient();
  const bank = await parseMarkdownBank();
  const slug = slugify(bank.title);

  const { data: bankRow, error: bankError } = await supabase
    .from('question_banks')
    .upsert(
      {
        slug,
        title: bank.title,
        description: `${bank.program} ${bank.course}`.trim(),
        source_path: 'bank-soal-rpl-online.md',
        total_questions: bank.questions.length
      },
      { onConflict: 'slug' }
    )
    .select('*')
    .single();

  if (bankError) {
    throw bankError;
  }

  const { error: deleteQuestionsError } = await supabase.from('questions').delete().eq('bank_id', bankRow.id);
  if (deleteQuestionsError) {
    throw deleteQuestionsError;
  }

  const examSlug = 'rpl-semester-ii';
  const { data: examRow, error: examError } = await supabase
    .from('exams')
    .upsert(
      {
        slug: examSlug,
        title: bank.title,
        description: 'Ujian online RPL berbasis bank soal Markdown',
        duration_minutes: 60,
        shuffle_questions: true,
        shuffle_options: true,
        published: true,
        bank_id: bankRow.id
      },
      { onConflict: 'slug' }
    )
    .select('*')
    .single();

  if (examError) {
    throw examError;
  }

  const insertedQuestions = [];
  for (const question of bank.questions) {
    const { data: questionRow, error: questionError } = await supabase
      .from('questions')
      .insert({
        bank_id: bankRow.id,
        number: question.number,
        type: question.type,
        stem: question.stem,
        explanation: question.explanation,
        correct_option_labels: question.answerLabels
      })
      .select('*')
      .single();

    if (questionError) {
      throw questionError;
    }

    insertedQuestions.push(questionRow);

    const optionRows = question.options.map((option, index) => ({
      question_id: questionRow.id,
      label: option.label,
      text: option.text,
      sort_order: index
    }));

    const { error: optionError } = await supabase.from('options').insert(optionRows);
    if (optionError) {
      throw optionError;
    }
  }

  return {
    bank: bankRow,
    exam: examRow,
    questionCount: insertedQuestions.length
  };
}

function rowsToAnswersMap(rows) {
  const answers = {};
  for (const row of rows ?? []) {
    answers[row.question_id] = row.selected_option_labels ?? [];
  }
  return answers;
}

function countAnsweredAnswers(answersByQuestionId) {
  return Object.values(answersByQuestionId ?? []).filter((value) => Array.isArray(value) && value.length > 0).length;
}

function progressFromAnswers(questions, answersByQuestionId) {
  const answeredQuestionNumbers = questions
    .filter((question) => {
      const answer = answersByQuestionId?.[question.id];
      return Array.isArray(answer) && answer.length > 0;
    })
    .map((question) => question.number);

  return answeredQuestionNumbers.length > 0 ? Math.max(...answeredQuestionNumbers) : 0;
}

function buildAttemptAnswerRows(attemptId, questions, answersByQuestionId) {
  return questions
    .filter((question) => Array.isArray(answersByQuestionId?.[question.id]) && answersByQuestionId[question.id].length > 0)
    .map((question) => ({
      attempt_id: attemptId,
      question_id: question.id,
      selected_option_labels: answersByQuestionId[question.id],
      correct_option_labels: question.correct_option_labels ?? [],
      is_correct: false,
      points: 0
    }));
}

function toExamPublicQuestion(question) {
  return {
    id: question.id,
    number: question.number,
    type: question.type,
    stem: question.stem,
    explanation: question.explanation ?? '',
    options: question.options ?? []
  };
}

async function getGuestAttemptBundleFromSupabase(supabase, attemptId) {
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, exam_id, nim, student_name, whatsapp, theme, status, started_at, ends_at, submitted_at, duration_minutes, current_page, progress_question_number, answered_count, total_questions, score, total_points, percentage')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError) {
    throw attemptError;
  }
  if (!attempt) {
    return null;
  }

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, slug, title, description, duration_minutes, shuffle_questions, shuffle_options, published, bank_id')
    .eq('id', attempt.exam_id)
    .maybeSingle();

  if (examError) {
    throw examError;
  }
  if (!exam) {
    return null;
  }

  const { data: questions, error: questionError } = await supabase
    .from('questions')
    .select('id, number, type, stem, explanation, correct_option_labels, bank_id')
    .eq('bank_id', exam.bank_id)
    .order('number', { ascending: true });

  if (questionError) {
    throw questionError;
  }

  const questionIds = questions.map((question) => question.id);
  const { data: options, error: optionError } = await supabase
    .from('options')
    .select('id, question_id, label, text, sort_order')
    .in('question_id', questionIds)
    .order('sort_order', { ascending: true });

  if (optionError) {
    throw optionError;
  }

  const optionMap = new Map();
  for (const option of options ?? []) {
    const list = optionMap.get(option.question_id) ?? [];
    list.push({
      id: option.id,
      label: option.label,
      text: option.text
    });
    optionMap.set(option.question_id, list);
  }

  const { data: answerRows, error: answerError } = await supabase
    .from('attempt_answers')
    .select('attempt_id, question_id, selected_option_labels, correct_option_labels, is_correct, points')
    .eq('attempt_id', attemptId)
    .order('question_id', { ascending: true });

  if (answerError) {
    throw answerError;
  }

  const answers = rowsToAnswersMap(answerRows);

  return {
    attempt,
    exam,
    questions: (questions ?? []).map((question) => ({
      id: question.id,
      number: question.number,
      type: question.type,
      stem: question.stem,
      explanation: question.explanation,
      correctLabels: question.correct_option_labels ?? [],
      options: optionMap.get(question.id) ?? []
    })),
    answers
  };
}

async function getExistingGuestAttemptByNim(supabase, examId, nim) {
  const { data, error } = await supabase
    .from('attempts')
    .select('id, exam_id, nim, student_name, whatsapp, theme, status, started_at, ends_at, submitted_at, duration_minutes, current_page, progress_question_number, answered_count, total_questions, score, total_points, percentage')
    .eq('exam_id', examId)
    .eq('nim', nim)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

async function getGuestQuestionsForExam(supabase, examId) {
  const bundle = await getQuestionsFromSupabase(supabase, examId);
  if (!bundle) {
    return null;
  }

  return {
    exam: bundle.exam,
    questions: bundle.questions.map((question) => toExamPublicQuestion(question))
  };
}

async function listAttemptsForAdminFromSupabase(supabase) {
  const { data, error } = await supabase
    .from('attempts')
    .select('id, exam_id, nim, student_name, whatsapp, theme, status, started_at, ends_at, submitted_at, duration_minutes, current_page, progress_question_number, answered_count, total_questions, score, total_points, percentage')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function updateGuestAttemptProgressInSupabase(supabase, attemptId, payload) {
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, exam_id, nim, student_name, whatsapp, theme, status, started_at, ends_at, submitted_at, duration_minutes, current_page, progress_question_number, answered_count, total_questions, score, total_points, percentage')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError) {
    throw attemptError;
  }
  if (!attempt) {
    return null;
  }
  if (attempt.status === 'submitted') {
    return attempt;
  }

  const { data: examRow, error: examRowError } = await supabase
    .from('exams')
    .select('bank_id')
    .eq('id', attempt.exam_id)
    .maybeSingle();

  if (examRowError) {
    throw examRowError;
  }

  const { data: questions, error: questionError } = await supabase
    .from('questions')
    .select('id, number, type, stem, explanation, correct_option_labels, bank_id')
    .eq('bank_id', examRow?.bank_id)
    .order('number', { ascending: true });

  if (questionError) {
    throw questionError;
  }

  const answersByQuestionId = payload.answersByQuestionId ?? {};
  const answeredCount = payload.answeredCount ?? countAnsweredAnswers(answersByQuestionId);
  const progressQuestionNumber = payload.progressQuestionNumber ?? progressFromAnswers(questions ?? [], answersByQuestionId);
  const currentPage = payload.currentPage ?? attempt.current_page ?? 1;
  const totalQuestions = payload.totalQuestions ?? attempt.total_questions ?? questions.length;

  const { error: updateError } = await supabase
    .from('attempts')
    .update({
      current_page: currentPage,
      progress_question_number: progressQuestionNumber,
      answered_count: answeredCount,
      total_questions: totalQuestions,
      theme: payload.theme ?? attempt.theme
    })
    .eq('id', attemptId);

  if (updateError) {
    throw updateError;
  }

  const answerRows = buildAttemptAnswerRows(attemptId, questions ?? [], answersByQuestionId);
  if (answerRows.length > 0) {
    const { error: answersError } = await supabase
      .from('attempt_answers')
      .upsert(answerRows, { onConflict: 'attempt_id,question_id' });

    if (answersError) {
      throw answersError;
    }
  }

  const answeredIds = new Set(answerRows.map((row) => row.question_id));
  const unansweredQuestionIds = (questions ?? [])
    .map((question) => question.id)
    .filter((questionId) => !answeredIds.has(questionId));

  if (unansweredQuestionIds.length > 0) {
    const { error: deleteAnswersError } = await supabase
      .from('attempt_answers')
      .delete()
      .eq('attempt_id', attemptId)
      .in('question_id', unansweredQuestionIds);

    if (deleteAnswersError) {
      throw deleteAnswersError;
    }
  }

  return {
    ...attempt,
    current_page: currentPage,
    progress_question_number: progressQuestionNumber,
    answered_count: answeredCount,
    total_questions: totalQuestions,
    theme: payload.theme ?? attempt.theme
  };
}

async function submitGuestAttemptInSupabase(supabase, attemptId, answersByQuestionId) {
  const bundle = await getGuestAttemptBundleFromSupabase(supabase, attemptId);
  if (!bundle) {
    return null;
  }
  if (bundle.attempt.status === 'submitted') {
    return bundle;
  }

  const totalQuestions = bundle.questions.length;
  const answeredCount = countAnsweredAnswers(answersByQuestionId);
  if (answeredCount !== totalQuestions) {
    throw new Error('Semua soal harus dijawab sebelum submit.');
  }

  const scored = scoreQuestions(
    bundle.questions.map((question) => ({
      id: question.id,
      correctLabels: question.correctLabels ?? []
    })),
    answersByQuestionId
  );

  const submittedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('attempts')
    .update({
      status: 'submitted',
      submitted_at: submittedAt,
      score: scored.score,
      total_points: scored.totalPoints,
      percentage: scored.percentage,
      answered_count: answeredCount,
      progress_question_number: totalQuestions,
      current_page: Math.ceil(totalQuestions / 10)
    })
    .eq('id', attemptId);

  if (updateError) {
    throw updateError;
  }

  const rows = scored.scoredAnswers.map((row) => ({
    attempt_id: attemptId,
    question_id: row.questionId,
    selected_option_labels: row.selectedLabels,
    correct_option_labels: row.correctLabels,
    is_correct: row.isCorrect,
    points: row.points
  }));

  const { error: insertError } = await supabase
    .from('attempt_answers')
    .upsert(rows, { onConflict: 'attempt_id,question_id' });
  if (insertError) {
    throw insertError;
  }

  return getGuestAttemptBundleFromSupabase(supabase, attemptId);
}

export async function startGuestExamAttempt(examId, participant) {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase configuration is missing.');
  }

  const supabase = createSupabaseAdminClient();
  const examBundle = await getGuestQuestionsForExam(supabase, examId);
  if (!examBundle) {
    return null;
  }

  const nim = participant.nim.trim();
  const existing = await getExistingGuestAttemptByNim(supabase, examId, nim);
  if (existing) {
    if (existing.status === 'submitted') {
      const error = new Error('NIM ini sudah dipakai dan ujian sudah selesai.');
      error.code = 'ALREADY_SUBMITTED';
      throw error;
    }

    const bundle = await getGuestAttemptBundleFromSupabase(supabase, existing.id);
    return {
      ...bundle,
      resume: true
    };
  }

  const durationMinutes = GUEST_EXAM_DURATION_MINUTES;
  const startedAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const { data: attempt, error: insertError } = await supabase
    .from('attempts')
    .insert({
      exam_id: examId,
      nim,
      student_name: participant.studentName.trim(),
      whatsapp: participant.whatsapp.trim(),
      theme: participant.theme === 'light' ? 'light' : 'dark',
      status: 'in_progress',
      started_at: startedAt,
      ends_at: endsAt,
      duration_minutes: durationMinutes,
      current_page: 1,
      progress_question_number: 0,
      answered_count: 0,
      total_questions: examBundle.questions.length,
      score: 0,
      total_points: examBundle.questions.length,
      percentage: 0
    })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    ...examBundle,
    attempt: {
      id: attempt.id,
      nim,
      student_name: participant.studentName.trim(),
      whatsapp: participant.whatsapp.trim(),
      theme: participant.theme === 'light' ? 'light' : 'dark',
      status: 'in_progress',
      started_at: startedAt,
      ends_at: endsAt,
      current_page: 1,
      progress_question_number: 0,
      answered_count: 0,
      total_questions: examBundle.questions.length
    },
    resume: false
  };
}

export async function getAttemptSessionById(attemptId) {
  if (!hasSupabaseConfig()) {
    return getMockAttempt(attemptId);
  }

  const supabase = createSupabaseAdminClient();
  const bundle = await getGuestAttemptBundleFromSupabase(supabase, attemptId);
  if (!bundle) {
    return null;
  }

  return {
    attempt: bundle.attempt,
    exam: bundle.exam,
    questions: bundle.questions.map((question) => toExamPublicQuestion(question)),
    answers: bundle.answers
  };
}

export async function saveGuestAttemptProgress(attemptId, payload) {
  if (!hasSupabaseConfig()) {
    const attempt = getMockAttempt(attemptId);
    if (!attempt) {
      return null;
    }
    const answersByQuestionId = payload.answersByQuestionId ?? {};
    const answeredCount = countAnsweredAnswers(answersByQuestionId);
    const currentPage = payload.currentPage ?? attempt.current_page ?? 1;
    const progressQuestionNumber = payload.progressQuestionNumber ?? 0;
    const theme = payload.theme ?? attempt.theme;
    const updated = {
      ...attempt,
      answers: answersByQuestionId,
      current_page: currentPage,
      progress_question_number: progressQuestionNumber,
      answered_count: answeredCount,
      total_questions: payload.totalQuestions ?? attempt.total_questions ?? 0,
      theme
    };
    getMockStore().attempts.set(attemptId, updated);
    return updated;
  }

  const supabase = createSupabaseAdminClient();
  return updateGuestAttemptProgressInSupabase(supabase, attemptId, payload);
}

export async function submitGuestAttempt(attemptId, answersByQuestionId) {
  if (!hasSupabaseConfig()) {
    return submitMockAttempt(attemptId, { answers: answersByQuestionId });
  }

  const supabase = createSupabaseAdminClient();
  return submitGuestAttemptInSupabase(supabase, attemptId, answersByQuestionId);
}

export async function listAdminAttempts() {
  if (!hasSupabaseConfig()) {
    const summary = getMockSummary();
    return summary.recentAttempts ?? [];
  }

  const supabase = createSupabaseAdminClient();
  return listAttemptsForAdminFromSupabase(supabase);
}

export async function exportAdminAttemptsCsv() {
  const attempts = await listAdminAttempts();
  const rows = attempts.filter((attempt) => attempt.status === 'submitted');
  const header = ['NIM', 'Nama', 'Whatsapp', 'Score'];
  const lines = [header.join(',')];

  for (const attempt of rows) {
    lines.push([
      JSON.stringify(attempt.nim ?? ''),
      JSON.stringify(attempt.student_name ?? ''),
      JSON.stringify(attempt.whatsapp ?? ''),
      JSON.stringify(attempt.score ?? 0)
    ].join(','));
  }

  return `${lines.join('\n')}\n`;
}

export async function deleteAdminAttempt(attemptId) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdminClient();
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('id')
      .eq('id', attemptId)
      .maybeSingle();

    if (attemptError) {
      throw attemptError;
    }
    if (!attempt) {
      return false;
    }

    const { error: answersError } = await supabase.from('attempt_answers').delete().eq('attempt_id', attemptId);
    if (answersError) {
      throw answersError;
    }

    const { error: deleteError } = await supabase.from('attempts').delete().eq('id', attemptId);
    if (deleteError) {
      throw deleteError;
    }

    return true;
  }

  return deleteMockAttempt(attemptId);
}
