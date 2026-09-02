import { RecommendationProfile, SupportNeed } from '../../types';

export type AssessmentLocale = 'en' | 'fr';
export type ReflectionDomain = 'attention' | 'sensory' | 'literacy' | 'coordination' | 'numbers';

export interface ReflectionQuestion {
  id: string;
  domain: ReflectionDomain;
  need: SupportNeed;
  text: Record<AssessmentLocale, string>;
}

export interface ReflectionAnswer {
  questionId: string;
  score: number;
}

export interface DomainResult {
  domain: ReflectionDomain;
  score: number;
  band: 'lighter' | 'somewhat' | 'prominent' | 'veryProminent';
}

export interface ReflectionReport {
  domains: DomainResult[];
  needs: Array<{ need: SupportNeed; weight: number }>;
}

const q = (
  id: string,
  domain: ReflectionDomain,
  need: SupportNeed,
  en: string,
  fr: string
): ReflectionQuestion => ({ id, domain, need, text: { en, fr } });

export const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  q('att-1', 'attention', SupportNeed.Focus, 'I find it hard to stay with a task when it is repetitive.', 'J’ai du mal à rester sur une tâche lorsqu’elle est répétitive.'),
  q('att-2', 'attention', SupportNeed.TaskInitiation, 'Starting a task can take more effort than doing it.', 'Commencer une tâche peut demander plus d’effort que la réaliser.'),
  q('att-3', 'attention', SupportNeed.Organization, 'I lose track of priorities when several things compete for attention.', 'Je perds mes priorités lorsque plusieurs choses réclament mon attention.'),
  q('att-4', 'attention', SupportNeed.WorkingMemory, 'I need information to remain visible so I do not forget it.', 'J’ai besoin que l’information reste visible pour ne pas l’oublier.'),
  q('att-5', 'attention', SupportNeed.Movement, 'Movement helps me think, listen, or reset.', 'Bouger m’aide à réfléchir, écouter ou repartir.'),
  q('att-6', 'attention', SupportNeed.TaskSetup, 'Preparing the space and materials is a barrier to beginning.', 'Préparer l’espace et le matériel freine mon démarrage.'),

  q('sen-1', 'sensory', SupportNeed.SensoryRegulation, 'Sounds, light, textures, or smells can become overwhelming.', 'Les sons, lumières, textures ou odeurs peuvent devenir envahissants.'),
  q('sen-2', 'sensory', SupportNeed.Recovery, 'I need meaningful recovery time after demanding environments.', 'J’ai besoin d’un vrai temps de récupération après un environnement exigeant.'),
  q('sen-3', 'sensory', SupportNeed.Predictability, 'Unexpected changes use a lot of my energy.', 'Les changements imprévus consomment beaucoup de mon énergie.'),
  q('sen-4', 'sensory', SupportNeed.Communication, 'Speaking becomes harder when I am overloaded or tired.', 'Parler devient plus difficile lorsque je suis surchargé·e ou fatigué·e.'),
  q('sen-5', 'sensory', SupportNeed.SensoryRegulation, 'I actively seek particular sensations to feel settled or alert.', 'Je recherche certaines sensations pour me sentir posé·e ou éveillé·e.'),
  q('sen-6', 'sensory', SupportNeed.Recovery, 'Social adaptation can leave me depleted afterward.', 'L’adaptation sociale peut me laisser épuisé·e ensuite.'),

  q('lit-1', 'literacy', SupportNeed.ReadingWriting, 'Dense text takes repeated reading to absorb.', 'Un texte dense demande plusieurs lectures pour être assimilé.'),
  q('lit-2', 'literacy', SupportNeed.Sequencing, 'I can lose my place or the order of information while reading.', 'Je peux perdre ma ligne ou l’ordre des informations en lisant.'),
  q('lit-3', 'literacy', SupportNeed.WorkingMemory, 'Holding verbal instructions in mind is effortful.', 'Garder des consignes verbales en mémoire me demande un effort.'),
  q('lit-4', 'literacy', SupportNeed.ReadingWriting, 'My ideas are easier to express aloud than in writing.', 'Mes idées sont plus faciles à exprimer oralement que par écrit.'),
  q('lit-5', 'literacy', SupportNeed.Sequencing, 'Spelling or symbol order is inconsistent even when I know the word.', 'L’orthographe ou l’ordre des symboles varie même lorsque je connais le mot.'),
  q('lit-6', 'literacy', SupportNeed.TaskSetup, 'Formatting and organizing a document can obscure the main idea.', 'La mise en forme et l’organisation d’un document peuvent masquer l’idée principale.'),

  q('mot-1', 'coordination', SupportNeed.MotorPlanning, 'New movement sequences take conscious planning.', 'Les nouvelles séquences de mouvement demandent une planification consciente.'),
  q('mot-2', 'coordination', SupportNeed.Sequencing, 'I know what I want to do but lose the order of the steps.', 'Je sais ce que je veux faire mais je perds l’ordre des étapes.'),
  q('mot-3', 'coordination', SupportNeed.TaskSetup, 'Clutter or an awkward setup makes physical tasks much harder.', 'Le désordre ou une installation peu pratique rendent les tâches physiques bien plus difficiles.'),
  q('mot-4', 'coordination', SupportNeed.MotorPlanning, 'Fine-motor tasks can be tiring or slower than expected.', 'Les tâches de motricité fine peuvent être fatigantes ou plus lentes que prévu.'),
  q('mot-5', 'coordination', SupportNeed.Predictability, 'I prefer to rehearse an unfamiliar route or action.', 'Je préfère répéter mentalement un trajet ou une action inconnue.'),
  q('mot-6', 'coordination', SupportNeed.Movement, 'I bump into objects or misjudge the space my body needs.', 'Je heurte des objets ou j’évalue mal l’espace nécessaire à mon corps.'),

  q('num-1', 'numbers', SupportNeed.NumberSupport, 'Quantities make more sense when I can see or touch them.', 'Les quantités ont plus de sens lorsque je peux les voir ou les manipuler.'),
  q('num-2', 'numbers', SupportNeed.Confidence, 'Being asked to calculate quickly creates pressure.', 'Devoir calculer rapidement crée de la pression.'),
  q('num-3', 'numbers', SupportNeed.NumberSupport, 'I rely on a calculator for calculations others may do mentally.', 'Je m’appuie sur une calculatrice pour des calculs que d’autres font mentalement.'),
  q('num-4', 'numbers', SupportNeed.Sequencing, 'Multi-step calculations are easy to lose track of.', 'Je perds facilement le fil des calculs en plusieurs étapes.'),
  q('num-5', 'numbers', SupportNeed.Predictability, 'Time, budgets, or measurements are easier with visible references.', 'Le temps, les budgets ou les mesures sont plus faciles avec des repères visibles.'),
  q('num-6', 'numbers', SupportNeed.Organization, 'I need a consistent layout to keep numbers aligned.', 'J’ai besoin d’une mise en page constante pour garder les nombres alignés.')
];

export const calculateReflectionReport = (answers: ReflectionAnswer[]): ReflectionReport => {
  const answerMap = new Map(answers.map(answer => [answer.questionId, Math.min(4, Math.max(0, answer.score))]));
  const domains = (['attention', 'sensory', 'literacy', 'coordination', 'numbers'] as ReflectionDomain[]).map(domain => {
    const questions = REFLECTION_QUESTIONS.filter(question => question.domain === domain);
    const total = questions.reduce((sum, question) => sum + (answerMap.get(question.id) ?? 0), 0);
    const score = Math.round((total / (questions.length * 4)) * 100);
    const band: DomainResult['band'] = score < 25 ? 'lighter' : score < 50 ? 'somewhat' : score < 75 ? 'prominent' : 'veryProminent';
    return { domain, score, band };
  });

  const needs = Object.values(SupportNeed)
    .map(need => {
      const questions = REFLECTION_QUESTIONS.filter(question => question.need === need);
      if (!questions.length) return { need, weight: 0 };
      const total = questions.reduce((sum, question) => sum + (answerMap.get(question.id) ?? 0), 0);
      return { need, weight: Math.round((total / (questions.length * 4)) * 100) };
    })
    .filter(item => item.weight > 0)
    .sort((left, right) => right.weight - left.weight || left.need.localeCompare(right.need));

  return { domains, needs };
};

export const buildRecommendationProfile = (report: ReflectionReport): RecommendationProfile => ({
  version: 1,
  source: 'assessment',
  needs: report.needs.slice(0, 8),
  createdAt: new Date().toISOString()
});
