import { notFound, redirect } from 'next/navigation';
import { getAttemptSessionById } from '../../../lib/storage.js';
import GuestExamRunner from '../../../components/guest-exam-runner.jsx';

export const dynamic = 'force-dynamic';

export default async function AttemptPage({ params }) {
  const { attemptId } = await params;
  const session = await getAttemptSessionById(attemptId);
  if (!session) {
    notFound();
  }

  if (session.attempt?.status === 'submitted') {
    redirect(`/results/${session.attempt.id}`);
  }

  return (
    <GuestExamRunner
      attempt={session.attempt}
      exam={session.exam}
      questions={session.questions}
      answers={session.answers}
    />
  );
}
