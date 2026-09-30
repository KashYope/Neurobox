import {
  AssessmentLocale, AssessmentModule, CATALOG_VERSION, SCORING_VERSION, ReflectionAnswer,
  REFLECTION_QUESTIONS, CORE_QUESTIONS, CONTEXT_IDS, QUESTION_BY_ID, validateAnswers
} from './model';
import { LEGACY_QUESTIONS } from './legacyModel';

export type AssessmentMode = 'modular' | 'integral';
export type AssessmentStage = 'intro' | 'modules' | 'questions' | 'break' | 'results' | 'review' | 'archives';
export interface AssessmentArchive {
  id: string;
  version: 1;
  answers: ReflectionAnswer[];
  updatedAt: string;
}
export interface AssessmentProgress {
  version: 2;
  catalogVersion: typeof CATALOG_VERSION;
  scoringVersion: typeof SCORING_VERSION;
  answers: ReflectionAnswer[];
  archives: AssessmentArchive[];
  skippedContext: string[];
  mode: AssessmentMode;
  stage: AssessmentStage;
  afterBreakStage: 'questions' | 'modules' | 'results';
  currentQuestionId: string;
  returnToResults: boolean;
  isComplete: boolean;
  acknowledged: boolean;
  personalizedFingerprint?: string;
  locale: AssessmentLocale;
  updatedAt: string;
}

export const isAssessmentComplete = (answers: ReflectionAnswer[]): boolean => {
  const ids = new Set(answers.map(answer => answer.questionId));
  return CORE_QUESTIONS.every(question => ids.has(question.id));
};

export function firstUnanswered(answers: ReflectionAnswer[], skipped: string[] = [], module?: AssessmentModule): string | undefined {
  const done = new Set([...answers.map(answer => answer.questionId), ...skipped]);
  return REFLECTION_QUESTIONS.find(question => (!module || question.domain === module) && !done.has(question.id))?.id;
}

export const createProgress = (locale: AssessmentLocale = 'fr'): AssessmentProgress => ({
  version: 2, catalogVersion: CATALOG_VERSION, scoringVersion: SCORING_VERSION,
  answers: [], archives: [], skippedContext: [], mode: 'modular', stage: 'intro', afterBreakStage: 'questions',
  currentQuestionId: REFLECTION_QUESTIONS[0].id, returnToResults: false,
  isComplete: false, acknowledged: false, locale, updatedAt: new Date().toISOString()
});

export function makeArchive(answers: ReflectionAnswer[], updatedAt: string): AssessmentArchive {
  const valid = validateAnswers(answers, LEGACY_QUESTIONS);
  // Le contenu identique ne crée pas plusieurs archives lors d'une réimportation.
  const ordered = LEGACY_QUESTIONS.map(question => valid.find(answer => answer.questionId === question.id)?.score ?? -1);
  return { id: `ndee-v1:${ordered.join(',')}`, version: 1, answers: valid, updatedAt };
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function migrateProgress(value: unknown): AssessmentProgress {
  if (!isRecord(value) || !Array.isArray(value.answers)) throw new Error('Invalid saved progress');
  if (value.version === 2) {
    if (value.catalogVersion !== CATALOG_VERSION || value.scoringVersion !== SCORING_VERSION) throw new Error('Unsupported questionnaire version');
    const answers = validateAnswers(value.answers);
    const stages: AssessmentStage[] = ['intro', 'modules', 'questions', 'break', 'results', 'review', 'archives'];
    if (!stages.includes(value.stage as AssessmentStage) || !['modular', 'integral'].includes(value.mode as string) ||
      (value.afterBreakStage !== undefined && !['questions', 'modules', 'results'].includes(value.afterBreakStage as string)) ||
      !QUESTION_BY_ID.has(value.currentQuestionId as string) || !Array.isArray(value.skippedContext) ||
      !value.skippedContext.every(id => typeof id === 'string' && CONTEXT_IDS.includes(id)) ||
      new Set(value.skippedContext).size !== value.skippedContext.length ||
      value.skippedContext.some(id => answers.some(answer => answer.questionId === id)) ||
      !Array.isArray(value.archives) || typeof value.acknowledged !== 'boolean' || typeof value.returnToResults !== 'boolean' ||
      !['en', 'fr'].includes(value.locale as string) || typeof value.updatedAt !== 'string' ||
      (value.personalizedFingerprint !== undefined && typeof value.personalizedFingerprint !== 'string')) throw new Error('Invalid saved state');
    const archives = value.archives.map(archive => {
      if (!isRecord(archive) || archive.version !== 1 || typeof archive.updatedAt !== 'string') throw new Error('Invalid archive');
      return makeArchive(validateAnswers(archive.answers, LEGACY_QUESTIONS), archive.updatedAt);
    });
    return { ...createProgress(value.locale as AssessmentLocale), ...value, answers, archives, isComplete: isAssessmentComplete(answers) } as AssessmentProgress;
  }
  if (value.version !== undefined && value.version !== 1) throw new Error('Unsupported progress version');
  // L'ancien import pouvait mélanger les identifiants NeuroAlign et les 30 identifiants NDee.
  const all = validateAnswers(value.answers, [...REFLECTION_QUESTIONS, ...LEGACY_QUESTIONS]);
  const progress = createProgress(value.locale === 'en' ? 'en' : 'fr');
  const legacy = all.filter(answer => !QUESTION_BY_ID.has(answer.questionId));
  progress.answers = all.filter(answer => QUESTION_BY_ID.has(answer.questionId));
  if (legacy.length) progress.archives = [makeArchive(legacy, typeof value.updatedAt === 'string' ? value.updatedAt : progress.updatedAt)];
  progress.currentQuestionId = firstUnanswered(progress.answers) ?? REFLECTION_QUESTIONS[0].id;
  progress.isComplete = isAssessmentComplete(progress.answers);
  // Reconfirmer le nouveau cadre descriptif, sans reprendre l'ancien index mélangé.
  return progress;
}

export function beginModule(progress: AssessmentProgress, module: AssessmentModule): AssessmentProgress {
  return { ...progress, mode: 'modular', stage: 'questions', returnToResults: false,
    currentQuestionId: firstUnanswered(progress.answers, progress.skippedContext, module) ?? REFLECTION_QUESTIONS.find(question => question.domain === module)!.id };
}

export function changeMode(progress: AssessmentProgress, mode: AssessmentMode): AssessmentProgress {
  return { ...progress, mode, stage: mode === 'modular' ? 'modules' : 'questions', returnToResults: false };
}

export function commitAnswer(progress: AssessmentProgress, score: number | null): AssessmentProgress {
  const current = QUESTION_BY_ID.get(progress.currentQuestionId)!;
  if (score === null && current.domain !== 'context') throw new Error('Only context can be skipped');
  const oldAnswer = progress.answers.find(answer => answer.questionId === current.id);
  const answers = progress.answers.filter(answer => answer.questionId !== current.id);
  if (score !== null) answers.push(...validateAnswers([{ questionId: current.id, score }]));
  const skippedContext = progress.skippedContext.filter(id => id !== current.id);
  if (score === null) skippedContext.push(current.id);
  const next = { ...progress, answers, skippedContext, isComplete: isAssessmentComplete(answers), updatedAt: new Date().toISOString() };
  if (progress.returnToResults) return { ...next, returnToResults: false, stage: 'results' };
  const advance = (value: AssessmentProgress): AssessmentProgress => !oldAnswer && score !== null && answers.length % 25 === 0
    ? { ...value, stage: 'break', afterBreakStage: value.stage as AssessmentProgress['afterBreakStage'] }
    : value;
  const sequence = REFLECTION_QUESTIONS.filter(question => progress.mode === 'integral' || question.domain === current.domain);
  const candidate = sequence[sequence.findIndex(question => question.id === current.id) + 1];
  if (!candidate) {
    // Un import partiel ou une navigation arrière ne doit pas déclarer le parcours terminé.
    const missing = firstUnanswered(answers, skippedContext, progress.mode === 'modular' ? current.domain : undefined);
    if (missing) return advance({ ...next, currentQuestionId: missing, stage: 'questions' });
    return advance({ ...next, stage: progress.mode === 'modular' ? 'modules' : 'results' });
  }
  return advance({ ...next, currentQuestionId: candidate.id, stage: 'questions' });
}

export function skipContext(progress: AssessmentProgress): AssessmentProgress {
  const skippedContext = CONTEXT_IDS.filter(id => !progress.answers.some(answer => answer.questionId === id));
  return { ...progress, skippedContext, stage: progress.returnToResults ? 'results' : progress.mode === 'modular' ? 'modules' : 'questions',
    returnToResults: false, currentQuestionId: CORE_QUESTIONS[0].id };
}

export function previousQuestion(progress: AssessmentProgress): AssessmentProgress {
  const current = QUESTION_BY_ID.get(progress.currentQuestionId)!;
  const sequence = REFLECTION_QUESTIONS.filter(question => progress.mode === 'integral' || question.domain === current.domain);
  const index = sequence.findIndex(question => question.id === current.id);
  return index > 0 ? { ...progress, currentQuestionId: sequence[index - 1].id } : { ...progress, stage: 'modules' };
}
