import type { AssessmentLocale, ScaleType } from './model';

const baseCopy = {
  en: {
    title: 'Explore your support profile', subtitle: 'A private self-reflection for noticing patterns and choosing practical supports.',
    privacy: 'Your answers and results stay in this browser. NDee does not upload them, score your health, or provide a diagnosis.',
    notMedical: 'This is not a medical or risk-assessment tool and does not replace professional care. If you are in immediate danger, contact local emergency services.',
    acknowledge: 'I understand what this reflection can and cannot do.', start: 'Start reflection', resume: 'Continue reflection',
    scale: ['Not at all', 'Rarely', 'Sometimes', 'Often', 'Very often'], previous: 'Previous', progress: 'Question',
    results: 'Your reflection profile', resultsIntro: 'These scores describe patterns in your responses, not conditions or diagnoses.',
    bands: { lighter: 'Less prominent', somewhat: 'Somewhat prominent', prominent: 'Prominent', veryProminent: 'Very prominent' },
    domains: { attention: 'Attention & action', sensory: 'Communication, sensory & energy', literacy: 'Reading & writing', coordination: 'Coordination & sequencing', numbers: 'Numbers & time' },
    personalize: 'Personalize my toolbox', personalized: 'Personalization saved on this device only.', openToolbox: 'Open my toolbox',
    review: 'Review answers', closeReview: 'Back to results', download: 'Download private PDF', qr: 'Show transfer QR', scan: 'Import transfer QR',
    reset: 'Delete reflection', resetConfirm: 'Delete all reflection answers from this device?', camera: 'Point the camera at an NDee transfer QR.',
    cameraError: 'The camera could not be started. Check permission and try again.', invalidQr: 'This is not a compatible NDee transfer QR.',
    methods: 'How this works', methodsText: 'NDee groups your responses into five reflection areas and turns the most prominent practical needs into optional toolbox preferences. The questionnaire is inspired by lived-experience themes, but it is not a validated clinical instrument.'
  },
  fr: {
    title: 'Explorez votre profil de soutien', subtitle: 'Une auto-réflexion privée pour repérer des tendances et choisir des soutiens pratiques.',
    privacy: 'Vos réponses et résultats restent dans ce navigateur. NDee ne les envoie pas, n’évalue pas votre santé et ne pose aucun diagnostic.',
    notMedical: 'Ceci n’est ni un outil médical ni une évaluation des risques et ne remplace pas un accompagnement professionnel. En cas de danger immédiat, contactez les services d’urgence locaux.',
    acknowledge: 'Je comprends ce que cette réflexion peut et ne peut pas faire.', start: 'Commencer la réflexion', resume: 'Continuer la réflexion',
    scale: ['Pas du tout', 'Rarement', 'Parfois', 'Souvent', 'Très souvent'], previous: 'Précédent', progress: 'Question',
    results: 'Votre profil de réflexion', resultsIntro: 'Ces scores décrivent les tendances de vos réponses, pas des troubles ni des diagnostics.',
    bands: { lighter: 'Peu présent', somewhat: 'Assez présent', prominent: 'Présent', veryProminent: 'Très présent' },
    domains: { attention: 'Attention et action', sensory: 'Communication, sensoriel et énergie', literacy: 'Lecture et écriture', coordination: 'Coordination et séquençage', numbers: 'Nombres et temps' },
    personalize: 'Personnaliser ma boîte à outils', personalized: 'Personnalisation enregistrée uniquement sur cet appareil.', openToolbox: 'Ouvrir ma boîte à outils',
    review: 'Revoir les réponses', closeReview: 'Retour aux résultats', download: 'Télécharger le PDF privé', qr: 'Afficher le QR de transfert', scan: 'Importer un QR de transfert',
    reset: 'Supprimer la réflexion', resetConfirm: 'Supprimer toutes les réponses de réflexion de cet appareil ?', camera: 'Placez un QR de transfert NDee devant la caméra.',
    cameraError: 'La caméra n’a pas pu démarrer. Vérifiez l’autorisation puis réessayez.', invalidQr: 'Ce QR de transfert NDee n’est pas compatible.',
    methods: 'Comment cela fonctionne', methodsText: 'NDee regroupe vos réponses en cinq espaces de réflexion et transforme les besoins pratiques les plus présents en préférences facultatives pour la boîte à outils. Le questionnaire s’inspire de thèmes d’expérience vécue, mais ce n’est pas un instrument clinique validé.'
  }
} as const;

export const METHOD_SOURCES = [
  { label: 'ASRS v1.1 information', href: 'https://www.hcp.med.harvard.edu/ncs/asrs.php' },
  { label: 'Camouflaging Autistic Traits Questionnaire research', href: 'https://molecularautism.biomedcentral.com/articles/10.1186/s13229-019-0274-6' },
  { label: 'British Dyslexia Association adult checklist', href: 'https://www.bdadyslexia.org.uk/dyslexia/how-is-dyslexia-diagnosed/dyslexia-checklists' },
  { label: 'CanChild information on developmental coordination', href: 'https://canchild.ca/en/diagnoses/developmental-coordination-disorder' },
  { label: 'Dyscalculia Network information', href: 'https://www.dyscalculianetwork.com/' }
];

const extra = {
  fr: {
    overview: 'Votre parcours', modules: 'Par modules', integral: 'Parcours intégral', mode: 'Mode du parcours',
    moduleHint: 'Choisissez un module. Vous pouvez changer de mode et reprendre plus tard sans perdre vos réponses.',
    fullHint: '138 questions disponibles : 134 dans cinq modules et 4 questions de contexte facultatives.',
    context: 'Contexte personnel (facultatif)', contextHint: 'Ces quatre questions sont facultatives. Elles ne contribuent ni aux scores ni aux recommandations. Vous pouvez les passer.',
    skip: 'Passer cette question', skipContext: 'Passer le contexte', skipped: 'Passée',
    crisisHelp: 'Si vous vous sentez en danger immédiat, contactez les services d’urgence locaux. Vous pouvez aussi demander du soutien à une personne de confiance ou à un professionnel. Cette réponse ne déclenche aucune alerte et ne mesure pas un risque.',
    next: 'Valider et continuer', nextAnswered: 'Continuer', saveEdit: 'Enregistrer et revenir aux résultats',
    leave: 'Enregistrer et quitter', summary: 'Voir ma synthèse', backModules: 'Choisir un module',
    answered: 'réponses', coreProgress: 'Questions principales', optionalProgress: 'Contexte facultatif', complete: 'Terminé', partial: 'Provisoire', empty: 'Non renseigné',
    breakTitle: 'Un moment pour souffler', breakText: '25 nouvelles réponses enregistrées. Vous pouvez faire une pause ou continuer maintenant.', continue: 'Continuer',
    saved: 'Enregistré sur cet appareil', saving: 'Enregistrement…', storageError: 'L’enregistrement a échoué. Votre réponse reste à l’écran : réessayez avant de quitter.',
    loadError: 'Impossible de lire la sauvegarde. Les données d’origine ont été conservées. Réessayez ou supprimez-les pour recommencer.', retry: 'Réessayer', loading: 'Chargement du parcours…',
    includeContext: 'Inclure mes réponses de contexte dans le PDF et le QR', exportHint: 'Par défaut, les réponses de contexte restent sur cet appareil. Le QR contient les réponses exportées : partagez-le seulement avec une personne de confiance.',
    exportError: 'L’export a échoué. Réessayez.', importSuccess: 'Réponses importées et enregistrées.',
    importConflict: 'Ce QR contient des réponses différentes de vos réponses locales. Remplacer uniquement ces réponses par celles du QR ?',
    importText: 'Coller le contenu d’un QR', importButton: 'Importer', close: 'Fermer',
    archiveTitle: 'Archives du questionnaire à 30 questions', archiveHint: 'Ces réponses et cette synthèse conservent le calcul d’origine. Elles ne sont pas converties en réponses au parcours complet.',
    archiveEmpty: 'Aucune archive enregistrée.', archiveDate: 'Archive du', oldScale: ['Pas du tout', 'Rarement', 'Parfois', 'Souvent', 'Très souvent'],
    details: 'Voir les sous-dimensions', viewAnswers: 'Voir les réponses', allAnswers: 'Toutes les réponses', updatePersonalization: 'Actualiser ma personnalisation',
    personalizationHint: 'Seuls les modules terminés contribuent aux huit besoins proposés au maximum. Les modules incomplets restent visibles dans votre synthèse provisoire.',
    finishModule: 'Terminez au moins un module pour personnaliser votre boîte à outils.',
    changed: 'Vos réponses ont changé. Vous pouvez actualiser votre personnalisation.',
    methodsDetail: 'Chaque réponse est ramenée entre 0 et 100 selon son échelle, puis les réponses renseignées sont moyennées à poids égal par domaine et sous-dimension. Les réponses absentes ne valent pas zéro. Le contexte est exclu. Ces pourcentages décrivent vos réponses, pas une probabilité de trouble. Les sources ci-dessous sont des inspirations : ce questionnaire adapté n’est pas un instrument clinique validé.',
    contextExcluded: 'Contexte exclu de cet export.', contextIncluded: 'Contexte personnel — hors calcul', version: 'Version du questionnaire / du calcul',
    resetConfirm: 'Supprimer toutes les réponses et archives de réflexion de cet appareil ?', reset: 'Supprimer les réponses et archives',
    validateFirst: 'Choisissez une réponse pour continuer.'
  },
  en: {
    overview: 'Your journey', modules: 'By module', integral: 'Full journey', mode: 'Journey mode',
    moduleHint: 'Choose a module. You can change modes and come back later without losing your answers.',
    fullHint: '138 available questions: 134 across five modules and 4 optional context questions.',
    context: 'Personal context (optional)', contextHint: 'These four questions are optional. They do not contribute to scores or recommendations. You can skip them.',
    skip: 'Skip this question', skipContext: 'Skip context', skipped: 'Skipped',
    crisisHelp: 'If you are in immediate danger, contact local emergency services. You can also seek support from a trusted person or a professional. This answer does not trigger an alert or measure risk.',
    next: 'Confirm and continue', nextAnswered: 'Continue', saveEdit: 'Save and return to results',
    leave: 'Save and exit', summary: 'View my summary', backModules: 'Choose a module',
    answered: 'answers', coreProgress: 'Core questions', optionalProgress: 'Optional context', complete: 'Complete', partial: 'Provisional', empty: 'Not answered',
    breakTitle: 'A moment to breathe', breakText: '25 new answers saved. You can take a break or continue now.', continue: 'Continue',
    saved: 'Saved on this device', saving: 'Saving…', storageError: 'Saving failed. Your answer is still on screen: please retry before leaving.',
    loadError: 'The saved progress could not be read. The original data has been preserved. Retry or delete it to start again.', retry: 'Retry', loading: 'Loading your journey…',
    includeContext: 'Include my context answers in the PDF and QR', exportHint: 'By default, context answers stay on this device. The QR contains your exported answers: only share it with someone you trust.',
    exportError: 'Export failed. Please try again.', importSuccess: 'Answers imported and saved.',
    importConflict: 'This QR contains answers that differ from your local answers. Replace only these answers with those from the QR?',
    importText: 'Paste QR contents', importButton: 'Import', close: 'Close',
    archiveTitle: '30-question questionnaire archives', archiveHint: 'These answers and this summary retain the original scoring. They are not converted into answers to the full journey.',
    archiveEmpty: 'No saved archives.', archiveDate: 'Archive from', oldScale: ['Not at all', 'Rarely', 'Sometimes', 'Often', 'Very often'],
    details: 'View sub-dimensions', viewAnswers: 'View answers', allAnswers: 'All answers', updatePersonalization: 'Update my personalization',
    personalizationHint: 'Only completed modules contribute to the maximum of eight suggested needs. Incomplete modules remain visible in your provisional summary.',
    finishModule: 'Complete at least one module to personalize your toolbox.',
    changed: 'Your answers have changed. You can update your personalization.',
    methodsDetail: 'Each answer is normalized from 0 to 100 using its scale, then answered items are averaged with equal weight per domain and sub-dimension. Missing answers are not zero. Context is excluded. These percentages describe your answers, not the probability of a condition. The sources below are inspirations: this adapted questionnaire is not a validated clinical instrument.',
    contextExcluded: 'Context excluded from this export.', contextIncluded: 'Personal context — excluded from scoring', version: 'Questionnaire / scoring version',
    resetConfirm: 'Delete all reflection answers and archives from this device?', reset: 'Delete answers and archives',
    validateFirst: 'Choose an answer to continue.'
  }
} as const;

export const getCopy = (locale: AssessmentLocale) => ({ ...baseCopy[locale], ...extra[locale] });

export function scaleOptions(scale: ScaleType, locale: AssessmentLocale): Array<{ value: number; label: string }> {
  const fr = locale === 'fr';
  if (scale === 'yes_no') return [{ value: 0, label: fr ? 'Non' : 'No' }, { value: 1, label: fr ? 'Oui' : 'Yes' }];
  if (scale === 'likert_7') return (fr
    ? ['Pas du tout d’accord', 'Pas d’accord', 'Plutôt pas d’accord', 'Ni d’accord ni pas d’accord', 'Plutôt d’accord', 'D’accord', 'Tout à fait d’accord']
    : ['Strongly disagree', 'Disagree', 'Somewhat disagree', 'Neither agree nor disagree', 'Somewhat agree', 'Agree', 'Strongly agree']
  ).map((label, index) => ({ value: index + 1, label }));
  const labels = scale === 'frequency_0_3'
    ? fr ? ['Jamais', 'Parfois', 'Souvent', 'Toujours'] : ['Never', 'Sometimes', 'Often', 'Always']
    : fr ? ['Jamais', 'Rarement', 'Parfois', 'Souvent', 'Très souvent'] : ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'];
  return labels.map((label, index) => ({ value: index + (scale === 'frequency_1_5' ? 1 : 0), label }));
}
