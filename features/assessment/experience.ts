import { CORE_QUESTIONS, DOMAINS, QUESTION_BY_ID, REFLECTION_QUESTIONS, type AssessmentModule } from './model';
import { commitAnswer, type AssessmentProgress } from './progress';

export const minutesForQuestions = (count: number): number => Math.ceil(Math.max(0, count) / 6);

export function progressSummary(progress: AssessmentProgress | null, theme?: AssessmentModule) {
  const questions = theme ? REFLECTION_QUESTIONS.filter(question => question.domain === theme) : CORE_QUESTIONS;
  const answered = new Set(progress?.answers.map(answer => answer.questionId));
  const completed = questions.filter(question => answered.has(question.id)).length;
  const next = questions.find(question => !answered.has(question.id));
  return { completed, total: questions.length, percent: Math.round(completed * 100 / questions.length),
    minutes: minutesForQuestions(questions.length - completed), nextQuestionId: next?.id,
    theme: !theme && progress?.stage === 'questions' && QUESTION_BY_ID.get(progress.currentQuestionId)?.domain !== 'context' ? QUESTION_BY_ID.get(progress.currentQuestionId)?.domain : next?.domain, complete: completed === questions.length };
}

// Le parcours guidé ignore le contexte facultatif sans fabriquer de réponses ni de refus.
export function continueProfile(progress: AssessmentProgress): AssessmentProgress {
  const summary = progressSummary(progress);
  const current = QUESTION_BY_ID.get(progress.currentQuestionId);
  const canResume = progress.stage === 'questions' && current?.domain !== 'context' && !progress.returnToResults;
  return { ...progress, mode: 'integral', returnToResults: false,
    stage: summary.complete ? 'results' : progress.stage === 'break' ? 'break' : 'questions',
    currentQuestionId: canResume ? progress.currentQuestionId : summary.nextQuestionId ?? progress.currentQuestionId };
}

export function commitProfileAnswer(progress: AssessmentProgress, score: number | null): AssessmentProgress {
  const next = commitAnswer(progress, score);
  if (progress.mode !== 'integral' || progress.returnToResults || QUESTION_BY_ID.get(progress.currentQuestionId)?.domain === 'context') return next;
  const summary = progressSummary(next);
  const destination = next.stage === 'break' ? next.afterBreakStage : next.stage;
  if (summary.complete) return next.stage === 'break' ? { ...next, afterBreakStage: 'results' } : { ...next, stage: 'results' };
  if (destination === 'results' || QUESTION_BY_ID.get(next.currentQuestionId)?.domain === 'context') {
    return { ...next, currentQuestionId: summary.nextQuestionId!, ...(next.stage === 'break' ? { afterBreakStage: 'questions' as const } : { stage: 'questions' as const }) };
  }
  return next;
}

export const themeNumber = (theme: AssessmentModule) => DOMAINS.indexOf(theme as typeof DOMAINS[number]) + 1;

// Une seule écriture en vol ; l'affichage ne change qu'après sauvegarde ET délai.
export function createAnswerTransition(save: (value: AssessmentProgress) => Promise<void>, publish: (value: AssessmentProgress) => void,
  wait: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, 200))) {
  let locked = false;
  let disposed = false;
  let epoch = 0;
  return {
    async submit(value: AssessmentProgress): Promise<boolean> {
      if (locked || disposed) return false;
      locked = true;
      const operationEpoch = epoch;
      try {
        await Promise.all([save(value), wait()]);
        if (!disposed && epoch === operationEpoch) publish(value);
        return true;
      } finally { locked = false; }
    },
    activate() { disposed = false; },
    dispose() { disposed = true; epoch++; }
  };
}

export function previousProfileQuestion(progress: AssessmentProgress): AssessmentProgress {
  if (progress.mode !== 'integral' || QUESTION_BY_ID.get(progress.currentQuestionId)?.domain === 'context') {
    const sequence = REFLECTION_QUESTIONS.filter(question => question.domain === QUESTION_BY_ID.get(progress.currentQuestionId)?.domain);
    const index = sequence.findIndex(question => question.id === progress.currentQuestionId);
    return index > 0 ? { ...progress, currentQuestionId: sequence[index - 1].id } : { ...progress, stage: 'modules' };
  }
  const index = CORE_QUESTIONS.findIndex(question => question.id === progress.currentQuestionId);
  return index > 0 ? { ...progress, currentQuestionId: CORE_QUESTIONS[index - 1].id } : { ...progress, stage: 'modules' };
}
