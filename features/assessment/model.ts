import { RecommendationProfile, SupportNeed } from '../../types';
import { QUESTION_CATALOG, CatalogQuestion, ScaleType } from './catalog';
import type { ReflectionDomain } from './catalog';
export type { AssessmentLocale, AssessmentModule, ReflectionDomain, ScaleType } from './catalog';

export const CATALOG_VERSION = 'neuroalign-138-v1';
export const SCORING_VERSION = 'needs-v2';
export const DOMAINS: ReflectionDomain[] = ['attention', 'sensory', 'literacy', 'coordination', 'numbers'];
export interface ReflectionAnswer { questionId: string; score: number }
export interface ReflectionQuestion extends CatalogQuestion { needs: SupportNeed[] }
export type Band = 'lighter' | 'somewhat' | 'prominent' | 'veryProminent';
export interface SectionResult {
  score: number | null;
  band: Band | null;
  answered: number;
  total: number;
  complete: boolean;
}
export interface DomainResult extends SectionResult {
  domain: ReflectionDomain;
  subscales: Array<SectionResult & { id: string }>;
}
export interface ReflectionReport {
  catalogVersion: typeof CATALOG_VERSION;
  scoringVersion: typeof SCORING_VERSION;
  domains: DomainResult[];
  needs: Array<{ need: SupportNeed; weight: number }>;
  answered: number;
  total: number;
  complete: boolean;
}

// Correspondances de soutien pratique, sans inférence de diagnostic.
const SUPPORT_BY_SUBSCALE: Record<string, SupportNeed[]> = {
  Executive: [SupportNeed.TaskInitiation, SupportNeed.Organization],
  Sequencing: [SupportNeed.Sequencing], AdhdMemory: [SupportNeed.WorkingMemory],
  Initiation: [SupportNeed.TaskInitiation, SupportNeed.TaskSetup],
  MotorAgitation: [SupportNeed.Movement], Restlessness: [SupportNeed.Movement],
  Attention: [SupportNeed.Focus], AuditoryProc: [SupportNeed.Communication, SupportNeed.SensoryRegulation],
  Distraction: [SupportNeed.Focus, SupportNeed.TaskSetup], Inhibition: [SupportNeed.Focus],
  Regulation: [SupportNeed.Recovery], Verbal: [SupportNeed.Communication],
  Impulsivity: [SupportNeed.Focus], Timing: [SupportNeed.Predictability],
  Compensation: [SupportNeed.Communication], Masking: [SupportNeed.Communication, SupportNeed.Recovery],
  Assimilation: [SupportNeed.Communication, SupportNeed.Recovery],
  Sensory: [SupportNeed.SensoryRegulation], Predictability: [SupportNeed.Predictability], Energy: [SupportNeed.Recovery],
  Laterality: [SupportNeed.MotorPlanning], Visuospatial: [SupportNeed.MotorPlanning],
  Phonological: [SupportNeed.ReadingWriting], VisualProc: [SupportNeed.ReadingWriting],
  DysMemory: [SupportNeed.WorkingMemory, SupportNeed.Sequencing], Effort: [SupportNeed.ReadingWriting],
  Spelling: [SupportNeed.ReadingWriting], Graphomotor: [SupportNeed.MotorPlanning, SupportNeed.ReadingWriting],
  Organization: [SupportNeed.Organization], Accuracy: [SupportNeed.ReadingWriting],
  WrittenLoad: [SupportNeed.ReadingWriting], AdminFriction: [SupportNeed.Organization, SupportNeed.TaskSetup],
  VerbalPref: [SupportNeed.Communication, SupportNeed.ReadingWriting],
  child_FineMotor: [SupportNeed.MotorPlanning], child_GrossMotor: [SupportNeed.MotorPlanning],
  child_Main: [SupportNeed.MotorPlanning], adult_GrossMotor: [SupportNeed.MotorPlanning],
  adult_Planning: [SupportNeed.MotorPlanning, SupportNeed.Sequencing], adult_FineMotor: [SupportNeed.MotorPlanning],
  ExecutionGap: [SupportNeed.TaskInitiation, SupportNeed.TaskSetup], PhysicalFatigue: [SupportNeed.Recovery],
  NumberSense: [SupportNeed.NumberSupport], Subitizing: [SupportNeed.NumberSupport],
  WorkingMemory: [SupportNeed.WorkingMemory], Estimation: [SupportNeed.NumberSupport],
  Retrieval: [SupportNeed.WorkingMemory, SupportNeed.NumberSupport], Arithmetic: [SupportNeed.NumberSupport],
  Symbols: [SupportNeed.NumberSupport], Functional: [SupportNeed.NumberSupport], Anxiety: [SupportNeed.Confidence],
  MentalMath: [SupportNeed.NumberSupport], MathMemory: [SupportNeed.WorkingMemory],
  TimeMoney: [SupportNeed.NumberSupport, SupportNeed.Predictability], Financial: [SupportNeed.Organization, SupportNeed.NumberSupport]
};

export const REFLECTION_QUESTIONS: ReflectionQuestion[] = QUESTION_CATALOG.map(question => {
  const needs = question.domain === 'context' ? [] : SUPPORT_BY_SUBSCALE[question.subscale];
  if (!needs) throw new Error(`Missing support mapping: ${question.subscale}`);
  return { ...question, needs };
});
export const QUESTION_BY_ID = new Map(REFLECTION_QUESTIONS.map(question => [question.id, question]));
export const CORE_QUESTIONS = REFLECTION_QUESTIONS.filter(question => question.domain !== 'context');
export const CONTEXT_IDS = REFLECTION_QUESTIONS.filter(question => question.domain === 'context').map(question => question.id);

export const SCALE_LIMITS: Record<ScaleType, { min: number; max: number }> = {
  frequency_0_4: { min: 0, max: 4 }, yes_no: { min: 0, max: 1 }, likert_7: { min: 1, max: 7 },
  frequency_0_3: { min: 0, max: 3 }, frequency_1_5: { min: 1, max: 5 }
};

export function validateAnswers(value: unknown, catalog: Array<{ id: string; scale?: ScaleType }> = REFLECTION_QUESTIONS): ReflectionAnswer[] {
  if (!Array.isArray(value)) throw new Error('Invalid answers');
  const questions = new Map(catalog.map(question => [question.id, question]));
  const seen = new Set<string>();
  return value.map(answer => {
    if (!answer || typeof answer !== 'object') throw new Error('Invalid answer');
    const question = questions.get(answer.questionId);
    const { min, max } = question?.scale ? SCALE_LIMITS[question.scale] : SCALE_LIMITS.frequency_0_4;
    if (!question || seen.has(answer.questionId) || !Number.isInteger(answer.score) || answer.score < min || answer.score > max) {
      throw new Error('Unknown, duplicate or out-of-range answer');
    }
    seen.add(answer.questionId);
    return { questionId: answer.questionId, score: answer.score };
  });
}

export function normalizedScore(question: CatalogQuestion, score: number): number {
  const { min, max } = SCALE_LIMITS[question.scale];
  const value = (score - min) / (max - min);
  return question.isReverse ? 1 - value : value;
}

export const scoreBand = (score: number): Band => score < 25 ? 'lighter' : score < 50 ? 'somewhat' : score < 75 ? 'prominent' : 'veryProminent';

function sectionResult(questions: ReflectionQuestion[], answers: Map<string, number>): SectionResult {
  const present = questions.filter(question => answers.has(question.id));
  const score = present.length ? Math.round(100 * present.reduce((sum, question) => sum + normalizedScore(question, answers.get(question.id)!), 0) / present.length) : null;
  return { score, band: score === null ? null : scoreBand(score), answered: present.length, total: questions.length, complete: present.length === questions.length };
}

export function calculateReflectionReport(input: ReflectionAnswer[]): ReflectionReport {
  const answers = new Map(validateAnswers(input).map(answer => [answer.questionId, answer.score]));
  const domains = DOMAINS.map(domain => {
    const questions = REFLECTION_QUESTIONS.filter(question => question.domain === domain);
    return {
      domain, ...sectionResult(questions, answers),
      subscales: [...new Set(questions.map(question => question.subscale))].map(id => ({ id, ...sectionResult(questions.filter(question => question.subscale === id), answers) }))
    };
  });
  const completed = new Set(domains.filter(domain => domain.complete).map(domain => domain.domain));
  const eligible = CORE_QUESTIONS.filter(question => completed.has(question.domain as ReflectionDomain));
  const needs = Object.values(SupportNeed).map(need => ({
    need, weight: sectionResult(eligible.filter(question => question.needs.includes(need)), answers).score ?? 0
  })).filter(item => item.weight > 0).sort((left, right) => right.weight - left.weight || left.need.localeCompare(right.need));
  return { catalogVersion: CATALOG_VERSION, scoringVersion: SCORING_VERSION, domains, needs, ...sectionResult(CORE_QUESTIONS, answers) };
}

export const buildRecommendationProfile = (report: ReflectionReport): RecommendationProfile => ({
  version: 1, source: 'assessment', needs: report.needs.slice(0, 8), createdAt: new Date().toISOString(),
  catalogVersion: CATALOG_VERSION, scoringVersion: SCORING_VERSION
});

// Empreinte locale déterministe : n'est ni un secret ni une signature de sécurité.
export function answerFingerprint(answers: ReflectionAnswer[]): string {
  return JSON.stringify(CORE_QUESTIONS.map(question => answers.find(answer => answer.questionId === question.id)?.score ?? -1));
}
