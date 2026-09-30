import { CATALOG_VERSION, SCORING_VERSION, REFLECTION_QUESTIONS, ReflectionAnswer, validateAnswers } from './model';
import { LEGACY_QUESTIONS } from './legacyModel';
import { AssessmentProgress, firstUnanswered, isAssessmentComplete, makeArchive } from './progress';

export type ImportedAssessment = { kind: 'full' | 'legacy'; answers: ReflectionAnswer[] };
// Algorithme historique conservé pour les QR NeuroAlign déjà distribués.
export function legacyCatalogHash(): string {
  const ids = REFLECTION_QUESTIONS.map(question => question.id).join('|');
  let hash = 0;
  for (let index = 0; index < ids.length; index++) hash = ((hash << 5) - hash + ids.charCodeAt(index)) | 0;
  return hash.toString(36);
}

export function encodeTransfer(answers: ReflectionAnswer[], includeContext = false): string {
  const valid = new Map(validateAnswers(answers).map(answer => [answer.questionId, answer.score]));
  return JSON.stringify({ app: 'NDee', v: 2, c: CATALOG_VERSION, s: SCORING_VERSION,
    d: REFLECTION_QUESTIONS.map(question => question.domain === 'context' && !includeContext ? -1 : valid.get(question.id) ?? -1) });
}

export function decodeTransfer(value: string): ImportedAssessment {
  if (value.length > 20000) throw new Error('Transfer too large');
  let data: unknown;
  try { data = JSON.parse(value); }
  catch { data = JSON.parse(decodeURIComponent(escape(atob(value)))); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid transfer');
  const parsed = data as Record<string, unknown>;
  if (parsed.app === 'NDee' && parsed.version === 1) {
    return { kind: 'legacy', answers: validateAnswers(parsed.answers, LEGACY_QUESTIONS) };
  }
  const current = parsed.app === 'NDee' && parsed.v === 2 && parsed.c === CATALOG_VERSION && parsed.s === SCORING_VERSION;
  const historical = parsed.app === undefined && parsed.v === 1 && parsed.h === legacyCatalogHash();
  if ((!current && !historical) || !Array.isArray(parsed.d) || parsed.d.length !== REFLECTION_QUESTIONS.length) throw new Error('Incompatible transfer');
  const answers: ReflectionAnswer[] = [];
  parsed.d.forEach((score, index) => {
    if (score !== -1) answers.push({ questionId: REFLECTION_QUESTIONS[index].id, score: score as number });
  });
  return { kind: 'full', answers: validateAnswers(answers) };
}

export function applyImport(progress: AssessmentProgress, imported: ImportedAssessment): AssessmentProgress {
  if (imported.kind === 'legacy') {
    const archive = makeArchive(imported.answers, new Date().toISOString());
    return { ...progress, archives: [...progress.archives.filter(item => item.id !== archive.id), archive], stage: 'archives' };
  }
  // L'écran demande confirmation pour les conflits ; les autres réponses locales restent présentes.
  const merged = new Map(progress.answers.map(answer => [answer.questionId, answer]));
  validateAnswers(imported.answers).forEach(answer => merged.set(answer.questionId, answer));
  const answers = [...merged.values()];
  const skippedContext = progress.skippedContext.filter(id => !merged.has(id));
  const isComplete = isAssessmentComplete(answers);
  return { ...progress, answers, skippedContext, isComplete, returnToResults: false,
    currentQuestionId: firstUnanswered(answers, skippedContext) ?? progress.currentQuestionId,
    stage: progress.acknowledged ? isComplete ? 'results' : 'modules' : 'intro' };
}
