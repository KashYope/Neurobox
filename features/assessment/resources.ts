import type { AssessmentLocale, ReflectionDomain } from './model';
import { originalInsights } from './insights';

interface Resource { title: string; href: string; language: 'en' }
interface Guidance { advice: string; tip: string; reading: Resource[] }

const links: Record<ReflectionDomain, Resource[]> = {
  attention: [{ title: 'ADDA — ADHD Resources', href: 'https://add.org/adhd-resources/', language: 'en' }],
  sensory: [
    { title: 'National Autistic Society — Sensory processing', href: 'https://www.autism.org.uk/advice-and-guidance/about-autism/sensory-processing', language: 'en' },
    { title: 'National Autistic Society — Masking', href: 'https://www.autism.org.uk/advice-and-guidance/behaviour/masking', language: 'en' }
  ],
  literacy: [{ title: 'British Dyslexia Association — Adult advice', href: 'https://www.bdadyslexia.org.uk/advice/adults', language: 'en' }],
  coordination: [{ title: 'Dyspraxia Foundation — Daily living', href: 'https://dyspraxiafoundation.co.uk/advice/daily-living', language: 'en' }],
  numbers: [{ title: 'British Dyslexia Association — Dyscalculia', href: 'https://www.bdadyslexia.org.uk/dyscalculia', language: 'en' }]
};

const guidance: Record<AssessmentLocale, Record<ReflectionDomain, Omit<Guidance, 'reading'>>> = {
  fr: {
    attention: { advice: 'Rendez la prochaine action visible et précise : une seule étape, avec le matériel déjà prêt. Déplacez les distractions que vous pouvez contrôler.', tip: 'Pour démarrer, écrivez une action de deux minutes : ouvrir le document, sortir un objet ou écrire la première phrase. Vous pouvez vous arrêter ensuite.' },
    sensory: { advice: 'Repérez les ambiances qui vous coûtent de l’énergie et celles qui vous aident à récupérer. Vous pouvez demander une consigne écrite, moins de bruit ou une pause.', tip: 'Après une interaction exigeante, prévoyez un moment au calme. Notez ce qui vous recharge plutôt que de remplir immédiatement ce créneau.' },
    literacy: { advice: 'Essayez plusieurs formats pour une même information : texte aéré, lecture audio ou dictée vocale. Choisissez celui qui vous demande le moins d’effort.', tip: 'Pour un texte dense, lisez un paragraphe à la fois et notez une phrase clé. Pour écrire, dictez un premier brouillon avant de le corriger.' },
    coordination: { advice: 'Décomposez les gestes ou les tâches en étapes visibles. Un espace dégagé et une place fixe pour les objets peuvent réduire les efforts de préparation.', tip: 'Pour une routine difficile, préparez une courte liste dans l’ordre des gestes et disposez le matériel dans le même ordre. Accordez-vous du temps sans chercher la vitesse.' },
    numbers: { advice: 'Utilisez des repères concrets : calculatrice, exemples écrits, calendrier et rappels. Gardez les étapes intermédiaires visibles pour ne pas tout retenir de tête.', tip: 'Pour une dépense ou un rendez-vous, écrivez le montant ou l’heure, puis vérifiez avec un outil. Pour une tâche, comparez la durée prévue et la durée réelle sans vous juger.' }
  },
  en: {
    attention: { advice: 'Make the next action visible and specific: one step, with the materials ready. Move distractions you can control out of the way.', tip: 'Start with a two-minute action: open the document, take out one item or write the first sentence. You can stop after that.' },
    sensory: { advice: 'Notice which environments drain your energy and which help you recover. You can ask for written instructions, less noise or a break.', tip: 'After a demanding interaction, leave time for quiet recovery. Note what recharges you instead of immediately filling that time.' },
    literacy: { advice: 'Try different formats for the same information: spaced text, audio or voice dictation. Choose what takes the least effort for you.', tip: 'Read dense text one paragraph at a time and note one key sentence. When writing, dictate a first draft before editing it.' },
    coordination: { advice: 'Break movements or tasks into visible steps. A clear workspace and a fixed place for objects can reduce preparation effort.', tip: 'For a difficult routine, list the steps and arrange materials in the same order. Allow enough time without aiming for speed.' },
    numbers: { advice: 'Use concrete supports: a calculator, written examples, a calendar and reminders. Keep intermediate steps visible instead of remembering everything mentally.', tip: 'Write down a payment amount or appointment time, then check it with a tool. Compare estimated and actual task time without judging yourself.' }
  }
};

export function getDomainGuidance(domain: ReflectionDomain, locale: AssessmentLocale): Guidance {
  return { ...guidance[locale][domain], reading: links[domain] };
}

export function getDomainInsights(domain: ReflectionDomain, locale: AssessmentLocale) {
  return originalInsights[locale][domain];
}

export const resultCopy = {
  fr: {
    chart: 'Votre profil en un regard', chartDescription: 'Chaque axe représente un thème. Plus le point est éloigné du centre, plus ces tendances ressortent dans vos réponses. Les pointillés et les cercles vides signalent un thème partiel ou non renseigné.',
    shortLabels: ['Attention', 'Sensoriel et énergie', 'Lecture et écriture', 'Coordination', 'Nombres et temps'],
    values: 'Lire les valeurs du graphe', missing: 'Non renseigné', partial: 'Partiel', complete: 'Terminé',
    advice: 'Conseil', tip: 'Une astuce à essayer', reading: 'Lectures et liens pour aller plus loin', english: 'en anglais',
    strategies: 'Stratégies et astuces', guides: 'Guides pratiques', tools: 'Outils à explorer', strengths: 'Forces possibles à explorer',
    more: 'Guides pratiques, forces et outils', strengthsNote: 'Ces exemples peuvent vous parler ou non. Le questionnaire ne mesure pas vos forces.',
    resourcesNote: 'Ces pistes sont à essayer selon vos besoins, quel que soit votre score. Les ressources abordent aussi des troubles spécifiques ; leur présence ne signifie pas que vous en avez un.'
  },
  en: {
    chart: 'Your profile at a glance', chartDescription: 'Each axis represents a theme. Points farther from the centre indicate more prominent patterns in your answers. Dashed lines and empty circles mark a partial or unanswered theme.',
    shortLabels: ['Attention', 'Sensory and energy', 'Reading and writing', 'Coordination', 'Numbers and time'],
    values: 'Read chart values', missing: 'Not answered', partial: 'Partial', complete: 'Complete',
    advice: 'Advice', tip: 'A practical tip to try', reading: 'Reading and links to explore further', english: 'in English',
    strategies: 'Strategies and tips', guides: 'Practical guides', tools: 'Tools to explore', strengths: 'Possible strengths to explore',
    more: 'Practical guides, strengths and tools', strengthsNote: 'These examples may or may not resonate with you. The questionnaire does not measure your strengths.',
    resourcesNote: 'Try these ideas according to your needs, whatever your score. Resources also discuss specific conditions; including them does not mean you have one.'
  }
} as const;
