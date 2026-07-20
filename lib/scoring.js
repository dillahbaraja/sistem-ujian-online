function normalizeSelected(values) {
  return [...new Set((values ?? []).map((value) => String(value).toUpperCase()))].sort();
}

export function scoreQuestions(questions, answersByQuestionId) {
  let score = 0;
  const scoredAnswers = questions.map((question) => {
    const selectedLabels = normalizeSelected(answersByQuestionId?.[question.id]);
    const correctLabels = normalizeSelected(question.correctLabels ?? question.answerLabels ?? []);
    const isCorrect = selectedLabels.join('|') === correctLabels.join('|');
    if (isCorrect) {
      score += 1;
    }

    return {
      questionId: question.id,
      selectedLabels,
      correctLabels,
      isCorrect,
      points: isCorrect ? 1 : 0
    };
  });

  const totalPoints = questions.length;
  const percentage = totalPoints ? Number(((score / totalPoints) * 100).toFixed(2)) : 0;
  return { score, totalPoints, percentage, scoredAnswers };
}

