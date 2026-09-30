// Source : NeuroAlign, questions.ts, commit 93a2f26. Textes et ordre conservés.
// Les scores NDee sont descriptifs ; les anciens seuils cliniques ne sont pas utilisés.
export type AssessmentLocale = 'en' | 'fr';
export type ReflectionDomain = 'attention' | 'sensory' | 'literacy' | 'coordination' | 'numbers';
export type AssessmentModule = ReflectionDomain | 'context';
export type ScaleType = 'frequency_0_4' | 'yes_no' | 'likert_7' | 'frequency_0_3' | 'frequency_1_5';
export interface CatalogQuestion {
  id: string;
  domain: AssessmentModule;
  subscale: string;
  scale: ScaleType;
  text: Record<AssessmentLocale, string>;
  isReverse?: boolean;
}

export const QUESTION_CATALOG: CatalogQuestion[] = [
  {
    id: 'INT_01',
    domain: 'context',
    subscale: 'Mood',
    scale: 'frequency_0_4',
    text: {
      en: "Do you experience persistent low mood, lack of energy, or a feeling of 'emptiness' that affects your daily activities?",
      fr: "Ressentez-vous une humeur basse persistante, un manque d'énergie ou un sentiment de 'vide' qui affecte vos activités ?"
    }
  },
  {
    id: 'INT_02',
    domain: 'context',
    subscale: 'Injury',
    scale: 'yes_no',
    text: {
      en: "Have you ever experienced a significant head injury, concussion, or loss of consciousness (e.g., from an accident or sports)?",
      fr: "Avez-vous déjà subi une blessure à la tête importante, une commotion cérébrale ou une perte de connaissance (ex: accident, sport) ?"
    }
  },
  {
    id: 'INT_03',
    domain: 'context',
    subscale: 'Neurology',
    scale: 'yes_no',
    text: {
      en: "Have you been diagnosed with or do you suspect a major neurological condition (such as epilepsy, Parkinson's, or MS)?",
      fr: "Avez-vous été diagnostiqué avec ou soupçonnez-vous une condition neurologique majeure (épilepsie, Parkinson, SEP, etc.) ?"
    }
  },
  {
    id: 'INT_04',
    domain: 'context',
    subscale: 'Crisis',
    scale: 'frequency_0_4',
    text: {
      en: "Do you experience 'dark thoughts', suicidal ideation, or a feeling that you are currently in a state of crisis?",
      fr: "Avez-vous des 'idées noires', des pensées suicidaires, ou le sentiment d'être actuellement en état de crise ?"
    }
  },


  {
    id: 'ADHD_01',
    domain: 'attention',
    subscale: 'Executive',
    scale: 'frequency_0_4',
    text: {
      en: "Once you have managed to complete the challenging, stimulating parts of a project, do you find yourself physically or mentally unable to wrap up the final, boring details?",
      fr: "Une fois les parties stimulantes d'un projet terminées, vous trouvez-vous incapable de boucler les derniers détails ennuyeux ?"
    }
  },
  {
    id: 'ADHD_02',
    domain: 'attention',
    subscale: 'Sequencing',
    scale: 'frequency_0_4',
    text: {
      en: "When a task requires you to organize your thoughts or materials in a specific sequence, do you feel overwhelmed or unable to get things in order?",
      fr: "Quand une tâche nécessite d'organiser vos pensées ou votre matériel dans un ordre précis, vous sentez-vous dépassé(e) ?"
    }
  },
  {
    id: 'ADHD_03',
    domain: 'attention',
    subscale: 'AdhdMemory',
    scale: 'frequency_0_4',
    text: {
      en: "Do appointments or obligations slip your mind, even those that are important to you or that you genuinely wanted to attend?",
      fr: "Oubliez-vous des rendez-vous ou des obligations, même ceux qui sont importants pour vous ?"
    }
  },
  {
    id: 'ADHD_04',
    domain: 'attention',
    subscale: 'Initiation',
    scale: 'frequency_0_4',
    text: {
      en: "When facing a task that requires a lot of thought, do you avoid or delay getting started (task paralysis)?",
      fr: "Face à une tâche demandant beaucoup de réflexion, évitez-vous ou retardez-vous le moment de vous y mettre ?"
    }
  },
  {
    id: 'ADHD_05',
    domain: 'attention',
    subscale: 'MotorAgitation',
    scale: 'frequency_0_4',
    text: {
      en: "When you are required to sit still for a long time, do you find yourself fidgeting, tapping your hands/feet, or squirming?",
      fr: "Lorsque vous devez rester assis longtemps, vous agitez-vous (taper des mains/pieds, bouger) ?"
    }
  },
  {
    id: 'ADHD_06',
    domain: 'attention',
    subscale: 'Restlessness',
    scale: 'frequency_0_4',
    text: {
      en: "Do you feel an internal sense of being overly active, or compelled to do things as if you were 'driven by a motor'?",
      fr: "Ressentez-vous une activité interne excessive, comme si vous étiez 'mû(e) par un moteur' ?"
    }
  },

  {
    id: 'ADHD_07',
    domain: 'attention',
    subscale: 'Attention',
    scale: 'frequency_0_4',
    text: {
      en: "Do you tend to make careless mistakes when working on a boring or difficult project?",
      fr: "Faites-vous des fautes d'étourderie lorsque vous travaillez sur un projet ennuyeux ou difficile ?"
    }
  },
  {
    id: 'ADHD_08',
    domain: 'attention',
    subscale: 'Attention',
    scale: 'frequency_0_4',
    text: {
      en: "Is it difficult for you to keep your attention focused when doing boring or repetitive work?",
      fr: "Avez-vous du mal à garder votre attention sur un travail ennuyeux ou répétitif ?"
    }
  },
  {
    id: 'ADHD_09',
    domain: 'attention',
    subscale: 'AuditoryProc',
    scale: 'frequency_0_4',
    text: {
      en: "Do you have trouble concentrating on what people are saying to you, even when they are speaking to you directly?",
      fr: "Avez-vous du mal à vous concentrer sur ce que l'on vous dit, même quand on s'adresse directement à vous ?"
    }
  },
  {
    id: 'ADHD_10',
    domain: 'attention',
    subscale: 'AdhdMemory',
    scale: 'frequency_0_4',
    text: {
      en: "Do you misplace or have difficulty finding items at home or work (e.g., keys, phone, wallet)?",
      fr: "Égare-vous ou avez-vous du mal à retrouver vos affaires (clés, téléphone, portefeuille) ?"
    }
  },
  {
    id: 'ADHD_11',
    domain: 'attention',
    subscale: 'Distraction',
    scale: 'frequency_0_4',
    text: {
      en: "Does activity or noise around you easily distract you?",
      fr: "Êtes-vous facilement distrait(e) par l'activité ou le bruit autour de vous ?"
    }
  },
  {
    id: 'ADHD_12',
    domain: 'attention',
    subscale: 'Inhibition',
    scale: 'frequency_0_4',
    text: {
      en: "Do you leave your seat in meetings or other situations in which you are expected to remain seated?",
      fr: "Quittez-vous votre siège lors de réunions ou situations où vous devriez rester assis(e) ?"
    }
  },
  {
    id: 'ADHD_13',
    domain: 'attention',
    subscale: 'Restlessness',
    scale: 'frequency_0_4',
    text: {
      en: "Do you feel generally restless or fidgety?",
      fr: "Vous sentez-vous agité(e) ou nerveux(se) en général ?"
    }
  },
  {
    id: 'ADHD_14',
    domain: 'attention',
    subscale: 'Regulation',
    scale: 'frequency_0_4',
    text: {
      en: "When you have time to yourself, do you have difficulty unwinding and relaxing?",
      fr: "Avez-vous du mal à décompresser et à vous détendre quand vous avez du temps pour vous ?"
    }
  },
  {
    id: 'ADHD_15',
    domain: 'attention',
    subscale: 'Verbal',
    scale: 'frequency_0_4',
    text: {
      en: "Do you find yourself talking too much when you are in social situations?",
      fr: "Vous arrive-t-il de trop parler lors de situations sociales ?"
    }
  },
  {
    id: 'ADHD_16',
    domain: 'attention',
    subscale: 'Impulsivity',
    scale: 'frequency_0_4',
    text: {
      en: "When in a conversation, do you finish other people's sentences before they can?",
      fr: "Dans une conversation, finissez-vous les phrases des autres avant eux ?"
    }
  },
  {
    id: 'ADHD_17',
    domain: 'attention',
    subscale: 'Timing',
    scale: 'frequency_0_4',
    text: {
      en: "Is waiting your turn difficult for you in situations where it is required?",
      fr: "Avez-vous du mal à attendre votre tour ?"
    }
  },
  {
    id: 'ADHD_18',
    domain: 'attention',
    subscale: 'Impulsivity',
    scale: 'frequency_0_4',
    text: {
      en: "Do you tend to interrupt others when they are busy?",
      fr: "Interrompez-vous les autres quand ils sont occupés ?"
    }
  },


  {
    id: 'CAT_01',
    domain: 'sensory',
    subscale: 'Compensation',
    scale: 'likert_7',
    text: {
      en: "When interacting with others, do you deliberately copy their body language or facial expressions to build rapport?",
      fr: "Copiez-vous délibérément le langage corporel ou les expressions faciales de votre interlocuteur pour créer un lien ?"
    }
  },
  {
    id: 'CAT_04',
    domain: 'sensory',
    subscale: 'Compensation',
    scale: 'likert_7',
    text: {
      en: "Do you rely on a prepared 'script' or set of phrases to get through social situations?",
      fr: "Vous appuyez-vous sur un 'script' ou des phrases préparées pour gérer les situations sociales ?"
    }
  },
  {
    id: 'CAT_05',
    domain: 'sensory',
    subscale: 'Compensation',
    scale: 'likert_7',
    text: {
      en: "Do you find yourself repeating phrases or distinct wording exactly as you first heard them?",
      fr: "Vous surprenez-vous à répéter des phrases ou tournures exactement comme vous les avez entendues ?"
    }
  },
  {
    id: 'CAT_08',
    domain: 'sensory',
    subscale: 'Compensation',
    scale: 'likert_7',
    text: {
      en: "In social interactions, do you use specific behaviors that you have learned by watching others?",
      fr: "Dans les interactions sociales, utilisez-vous des comportements appris en observant les autres ?"
    }
  },
  {
    id: 'CAT_11',
    domain: 'sensory',
    subscale: 'Compensation',
    scale: 'likert_7',
    text: {
      en: "Do you practice your facial expressions and body language in private to ensure they look natural?",
      fr: "Exercez-vous vos expressions faciales en privé pour qu'elles paraissent naturelles ?"
    }
  },
  {
    id: 'CAT_14',
    domain: 'sensory',
    subscale: 'Compensation',
    scale: 'likert_7',
    text: {
      en: "Do you explicitly research the rules of social interactions to improve your social skills?",
      fr: "Faites-vous des recherches explicites sur les règles sociales pour vous améliorer ?"
    }
  },
  {
    id: 'CAT_17',
    domain: 'sensory',
    subscale: 'Compensation',
    scale: 'likert_7',
    text: {
      en: "Do you learn how to speak or behave from media (TV, films, books) and apply it to your own interactions?",
      fr: "Apprenez-vous à parler ou agir via les médias (TV, films, livres) pour l'appliquer ensuite ?"
    }
  },
  {
    id: 'CAT_20',
    domain: 'sensory',
    subscale: 'Compensation',
    scale: 'likert_7',
    text: {
      en: "Do you think about the impression you make on others more than they likely think about you?",
      fr: "Pensez-vous davantage à l'impression que vous donnez aux autres qu'eux ne pensent à vous ?"
    }
  },
  {
    id: 'CAT_23',
    domain: 'sensory',
    subscale: 'Compensation',
    scale: 'likert_7',
    text: {
      en: "Do you pre-plan conversations in your head before they happen?",
      fr: "Planifiez-vous les conversations dans votre tête avant qu'elles n'aient lieu ?"
    }
  },

  {
    id: 'CAT_02',
    domain: 'sensory',
    subscale: 'Masking',
    scale: 'likert_7',
    text: {
      en: "Do you monitor your body language or facial expressions to ensure you appear relaxed?",
      fr: "Surveillez-vous votre langage corporel pour avoir l'air détendu(e) ?"
    }
  },
  {
    id: 'CAT_06',
    domain: 'sensory',
    subscale: 'Masking',
    scale: 'likert_7',
    text: {
      en: "Do you adjust your body language or face to appear interested, even if you are not?",
      fr: "Ajustez-vous votre visage ou corps pour paraître intéressé(e), même si vous ne l'êtes pas ?"
    }
  },
  {
    id: 'CAT_09',
    domain: 'sensory',
    subscale: 'Masking',
    scale: 'likert_7',
    text: {
      en: "Do you feel like you are 'acting' or playing a role rather than being yourself in social situations?",
      fr: "Avez-vous l'impression de jouer un rôle plutôt que d'être vous-même en société ?"
    }
  },
  {
    id: 'CAT_12',
    domain: 'sensory',
    subscale: 'Masking',
    scale: 'likert_7',
    text: {
      en: "Do you feel the need to put on an act to get through a social situation?",
      fr: "Ressentez-vous le besoin de jouer la comédie pour traverser une situation sociale ?"
    }
  },
  {
    id: 'CAT_15',
    domain: 'sensory',
    subscale: 'Masking',
    scale: 'likert_7',
    text: {
      en: "Do you consciously monitor your face and body to ensure you look interested in the person you are interacting with?",
      fr: "Surveillez-vous consciemment votre visage pour avoir l'air intéressé(e) ?"
    }
  },
  {
    id: 'CAT_18',
    domain: 'sensory',
    subscale: 'Masking',
    scale: 'likert_7',
    text: {
      en: "Do you feel unable to be your authentic self in social situations?",
      fr: "Vous sentez-vous incapable d'être authentiquement vous-même dans les situations sociales ?"
    }
  },
  {
    id: 'CAT_21',
    domain: 'sensory',
    subscale: 'Masking',
    scale: 'likert_7',
    text: {
      en: "Are you acutely aware of the impression you are making on others?",
      fr: "Êtes-vous extrêmement conscient(e) de l'impression que vous faites sur les autres ?"
    }
  },
  {
    id: 'CAT_24',
    domain: 'sensory',
    subscale: 'Masking',
    scale: 'likert_7',
    text: {
      en: "Do you have to force yourself to make eye contact with others?",
      fr: "Devez-vous vous forcer pour établir un contact visuel avec les autres ?"
    }
  },

  {
    id: 'CAT_03',
    domain: 'sensory',
    subscale: 'Assimilation',
    scale: 'likert_7',
    text: {
      en: "Do you feel the need to put on an act in order to get through a social situation?",
      fr: "Ressentez-vous le besoin de jouer un rôle pour gérer une situation sociale ?"
    }
  },
  {
    id: 'CAT_07',
    domain: 'sensory',
    subscale: 'Assimilation',
    scale: 'likert_7',
    text: {
      en: "In social situations, do you feel like you are 'performing' rather than being yourself?",
      fr: "En société, avez-vous l'impression de jouer un rôle plutôt que d'être vous-même ?"
    }
  },
  {
    id: 'CAT_10',
    domain: 'sensory',
    subscale: 'Assimilation',
    scale: 'likert_7',
    text: {
      en: "Do you have to force yourself to interact with people when you are in social situations?",
      fr: "Devez-vous vous forcer à interagir avec les gens dans les situations sociales ?"
    }
  },
  {
    id: 'CAT_13',
    domain: 'sensory',
    subscale: 'Assimilation',
    scale: 'likert_7',
    text: {
      en: "Do you spend a lot of time thinking about what you are going to say before you say it?",
      fr: "Passez-vous beaucoup de temps à penser à ce que vous allez dire avant de le dire ?"
    }
  },
  {
    id: 'CAT_16',
    domain: 'sensory',
    subscale: 'Assimilation',
    scale: 'likert_7',
    text: {
      en: "Do you avoid interacting with people unless you absolutely have to?",
      fr: "Évitez-vous d'interagir avec les gens à moins que ce ne soit absolument nécessaire ?"
    }
  },
  {
    id: 'CAT_19',
    domain: 'sensory',
    subscale: 'Assimilation',
    scale: 'likert_7',
    text: {
      en: "Is it difficult for you to interact with people you don't know well?",
      fr: "Trouvez-vous difficile d'interagir avec des gens que vous ne connaissez pas bien ?"
    }
  },
  {
    id: 'CAT_22',
    domain: 'sensory',
    subscale: 'Assimilation',
    scale: 'likert_7',
    text: {
      en: "Is appearing 'normal' or 'socially competent' important to you?",
      fr: "Est-ce important pour vous de paraître 'normal' ou socialement compétent ?"
    }
  },
  {
    id: 'CAT_25',
    domain: 'sensory',
    subscale: 'Assimilation',
    scale: 'likert_7',
    text: {
      en: "Do you avoid social situations where you might have to interact with others?",
      fr: "Évitez-vous les situations sociales où vous pourriez avoir à interagir avec d'autres ?"
    }
  },

  {
    id: 'AUT_SENS_01',
    domain: 'sensory',
    subscale: 'Sensory',
    scale: 'frequency_0_4',
    text: {
      en: "Do background noises (typing, conversations, traffic) make it hard for you to focus or think clearly?",
      fr: "Les bruits de fond (clavier, conversations, circulation) vous empêchent-ils de vous concentrer ou de penser clairement ?"
    }
  },
  {
    id: 'AUT_SENS_02',
    domain: 'sensory',
    subscale: 'Sensory',
    scale: 'frequency_0_4',
    text: {
      en: "Do you feel physically uncomfortable because of lighting conditions (brightness, flickering, neon lights)?",
      fr: "Vous sentez-vous physiquement mal à l'aise à cause de l'éclairage (luminosité, scintillement, néons) ?"
    }
  },
  {
    id: 'AUT_SENS_03',
    domain: 'sensory',
    subscale: 'Sensory',
    scale: 'frequency_0_4',
    text: {
      en: "Do certain sounds feel physically painful or overwhelming to you?",
      fr: "Certains sons sont-ils physiquement douloureux ou accablants pour vous ?"
    }
  },
  {
    id: 'AUT_SENS_04',
    domain: 'sensory',
    subscale: 'Sensory',
    scale: 'frequency_0_4',
    text: {
      en: "Do you feel drained after spending time in noisy or crowded environments?",
      fr: "Vous sentez-vous vidé(e) après avoir passé du temps dans des environnements bruyants ou bondés ?"
    }
  },
  {
    id: 'AUT_SENS_05',
    domain: 'sensory',
    subscale: 'Sensory',
    scale: 'frequency_0_4',
    text: {
      en: "Do you avoid places or situations mainly because of sensory discomfort?",
      fr: "Évitez-vous des lieux ou situations principalement à cause d'un inconfort sensoriel ?"
    }
  },
  {
    id: 'AUT_SENS_06',
    domain: 'sensory',
    subscale: 'Sensory',
    scale: 'frequency_0_4',
    text: {
      en: "Do you need silence or darkness to recover after a stimulating day?",
      fr: "Avez-vous besoin de silence ou d'obscurité pour récupérer après une journée stimulante ?"
    }
  },
  {
    id: 'AUT_SENS_07',
    domain: 'sensory',
    subscale: 'Sensory',
    scale: 'frequency_0_4',
    text: {
      en: "Do clothing textures, temperatures, or smells distract or irritate you?",
      fr: "Les textures de vêtements, températures ou odeurs vous distraient-elles ou vous irritent-elles ?"
    }
  },
  {
    id: 'AUT_SENS_08',
    domain: 'sensory',
    subscale: 'Sensory',
    scale: 'frequency_0_4',
    text: {
      en: "Do you feel overloaded when multiple sensory inputs happen at the same time?",
      fr: "Vous sentez-vous surchargé(e) lorsque plusieurs stimuli sensoriels surviennent en même temps ?"
    }
  },
  {
    id: 'AUT_PRED_01',
    domain: 'sensory',
    subscale: 'Predictability',
    scale: 'frequency_0_4',
    text: {
      en: "Do unexpected changes disrupt your ability to function or think clearly?",
      fr: "Les changements imprévus perturbent-ils votre capacité à fonctionner ou penser clairement ?"
    }
  },
  {
    id: 'AUT_PRED_02',
    domain: 'sensory',
    subscale: 'Predictability',
    scale: 'frequency_0_4',
    text: {
      en: "Do you need clear structure or advance notice to feel comfortable starting a task?",
      fr: "Avez-vous besoin d'une structure claire ou d'un préavis pour vous sentir à l'aise de commencer une tâche ?"
    }
  },
  {
    id: 'AUT_PRED_03',
    domain: 'sensory',
    subscale: 'Predictability',
    scale: 'frequency_0_4',
    text: {
      en: "Do vague instructions leave you feeling anxious or blocked?",
      fr: "Des instructions vagues vous laissent-elles anxieux(se) ou bloqué(e) ?"
    }
  },
  {
    id: 'AUT_PRED_04',
    domain: 'sensory',
    subscale: 'Predictability',
    scale: 'frequency_0_4',
    text: {
      en: "Do you prefer clear rules over implicit expectations?",
      fr: "Préférez-vous des règles claires aux attentes implicites ?"
    }
  },
  {
    id: 'AUT_PRED_05',
    domain: 'sensory',
    subscale: 'Predictability',
    scale: 'frequency_0_4',
    text: {
      en: "Do you replay conversations or events in your mind to understand what went wrong?",
      fr: "Rejouez-vous des conversations ou événements dans votre tête pour comprendre ce qui n'a pas été ?"
    }
  },
  {
    id: 'AUT_PRED_06',
    domain: 'sensory',
    subscale: 'Predictability',
    scale: 'frequency_0_4',
    text: {
      en: "Does it stress you when priorities change without explanation?",
      fr: "Est-ce stressant pour vous quand les priorités changent sans explication ?"
    }
  },
  {
    id: 'AUT_PRED_07',
    domain: 'sensory',
    subscale: 'Predictability',
    scale: 'frequency_0_4',
    text: {
      en: "Do you require extra time to mentally prepare for transitions?",
      fr: "Avez-vous besoin de temps supplémentaire pour vous préparer mentalement aux transitions ?"
    }
  },
  {
    id: 'AUT_NRG_01',
    domain: 'sensory',
    subscale: 'Energy',
    scale: 'frequency_0_4',
    text: {
      en: "Do social interactions leave you mentally exhausted, even if they went well?",
      fr: "Les interactions sociales vous laissent-elles mentalement épuisé(e), même si elles se sont bien passées ?"
    }
  },
  {
    id: 'AUT_NRG_02',
    domain: 'sensory',
    subscale: 'Energy',
    scale: 'frequency_0_4',
    text: {
      en: "Do you feel the need to recover alone after meetings or group work?",
      fr: "Ressentez-vous le besoin de récupérer seul(e) après des réunions ou travaux de groupe ?"
    }
  },
  {
    id: 'AUT_NRG_03',
    domain: 'sensory',
    subscale: 'Energy',
    scale: 'frequency_0_4',
    text: {
      en: "Are you functional at work but completely depleted afterwards?",
      fr: "Êtes-vous fonctionnel(le) au travail mais complètement vidé(e) après ?"
    }
  },
  {
    id: 'AUT_NRG_04',
    domain: 'sensory',
    subscale: 'Energy',
    scale: 'frequency_0_4',
    text: {
      en: "Do you suppress your natural reactions to fit expectations?",
      fr: "Réprimez-vous vos réactions naturelles pour correspondre aux attentes ?"
    }
  },
  {
    id: 'AUT_NRG_05',
    domain: 'sensory',
    subscale: 'Energy',
    scale: 'frequency_0_4',
    text: {
      en: "Does your productivity drop sharply after social exposure?",
      fr: "Votre productivité chute-t-elle brutalement après une exposition sociale ?"
    }
  },
  {
    id: 'AUT_NRG_06',
    domain: 'sensory',
    subscale: 'Energy',
    scale: 'frequency_0_4',
    text: {
      en: "Do you need solitude to regain mental clarity?",
      fr: "Avez-vous besoin de solitude pour retrouver votre clarté mentale ?"
    }
  },

  {
    id: 'DYS_01',
    domain: 'literacy',
    subscale: 'Laterality',
    scale: 'yes_no',
    text: {
      en: "Do you have difficulty distinguishing left from right instantly?",
      fr: "Avez-vous des difficultés à distinguer instantanément la gauche de la droite ?"
    }
  },
  {
    id: 'DYS_02',
    domain: 'literacy',
    subscale: 'Visuospatial',
    scale: 'yes_no',
    text: {
      en: "Is map reading or finding your way in a strange place confusing for you?",
      fr: "Trouvez-vous la lecture de carte ou l'orientation dans un nouveau lieu confuse ?"
    }
  },
  {
    id: 'DYS_03',
    domain: 'literacy',
    subscale: 'Phonological',
    scale: 'yes_no',
    text: {
      en: "Do you dislike reading aloud?",
      fr: "N'aimez-vous pas lire à haute voix ?"
    }
  },
  {
    id: 'DYS_04',
    domain: 'literacy',
    subscale: 'VisualProc',
    scale: 'yes_no',
    text: {
      en: "Does it take you longer than expected to read a page of a book?",
      fr: "Mettez-vous plus de temps que prévu pour lire une page d'un livre ?"
    }
  },
  {
    id: 'DYS_05',
    domain: 'literacy',
    subscale: 'DysMemory',
    scale: 'yes_no',
    text: {
      en: "Do you find it difficult to remember the sense (meaning) of what you have just read?",
      fr: "Trouvez-vous difficile de retenir le sens de ce que vous venez de lire ?"
    }
  },
  {
    id: 'DYS_06',
    domain: 'literacy',
    subscale: 'Effort',
    scale: 'yes_no',
    text: {
      en: "Do you find reading long books tedious or difficult?",
      fr: "Trouvez-vous la lecture de longs livres fastidieuse ou difficile ?"
    }
  },
  {
    id: 'DYS_07',
    domain: 'literacy',
    subscale: 'Spelling',
    scale: 'yes_no',
    text: {
      en: "Do you rely heavily on spell-checkers because of spelling difficulties?",
      fr: "Dépendez-vous des correcteurs orthographiques à cause de difficultés ?"
    }
  },
  {
    id: 'DYS_08',
    domain: 'literacy',
    subscale: 'Graphomotor',
    scale: 'yes_no',
    text: {
      en: "Is your handwriting difficult to read?",
      fr: "Votre écriture manuelle est-elle difficile à lire ?"
    }
  },
  {
    id: 'DYS_09',
    domain: 'literacy',
    subscale: 'Sequencing',
    scale: 'yes_no',
    text: {
      en: "Do you get confused if you have to speak in public?",
      fr: "Vous embrouillez-vous si vous devez parler en public ?"
    }
  },
  {
    id: 'DYS_10',
    domain: 'literacy',
    subscale: 'DysMemory',
    scale: 'yes_no',
    text: {
      en: "Is it difficult for you to take messages on the telephone and pass them on correctly?",
      fr: "Trouvez-vous difficile de prendre des messages et de les transmettre ?"
    }
  },
  {
    id: 'DYS_11',
    domain: 'literacy',
    subscale: 'Phonological',
    scale: 'yes_no',
    text: {
      en: "When saying a long word, do you find it difficult to get all the sounds in the right order?",
      fr: "En prononçant un mot long, avez-vous du mal à mettre les sons dans l'ordre ?"
    }
  },
  {
    id: 'DYS_12',
    domain: 'literacy',
    subscale: 'DysMemory',
    scale: 'yes_no',
    text: {
      en: "Is it difficult to do sums in your head without using your fingers or paper?",
      fr: "Trouvez-vous difficile de faire des calculs de tête sans aide ?"
    }
  },
  {
    id: 'DYS_13',
    domain: 'literacy',
    subscale: 'DysMemory',
    scale: 'yes_no',
    text: {
      en: "When using the telephone, do you get the numbers mixed up when you dial?",
      fr: "Au téléphone, mélangez-vous les chiffres en composant le numéro ?"
    }
  },
  {
    id: 'DYS_14',
    domain: 'literacy',
    subscale: 'Sequencing',
    scale: 'yes_no',
    text: {
      en: "Is it difficult for you to say the months of the year forwards in a fluent manner?",
      fr: "Trouvez-vous difficile de dire les mois de l'année dans l'ordre ?"
    }
  },
  {
    id: 'DYS_15',
    domain: 'literacy',
    subscale: 'Sequencing',
    scale: 'yes_no',
    text: {
      en: "Is it difficult for you to say the months of the year backwards?",
      fr: "Trouvez-vous difficile de dire les mois de l'année à l'envers ?"
    }
  },
  {
    id: 'DYS_16',
    domain: 'literacy',
    subscale: 'Organization',
    scale: 'yes_no',
    text: {
      en: "Do you mix up dates and times and miss appointments?",
      fr: "Confondez-vous les dates et heures, manquant ainsi des rendez-vous ?"
    }
  },
  {
    id: 'DYS_17',
    domain: 'literacy',
    subscale: 'Accuracy',
    scale: 'yes_no',
    text: {
      en: "When writing cheques or filling forms, do you frequently find yourself making mistakes?",
      fr: "En remplissant des chèques ou formulaires, faites-vous souvent des erreurs ?"
    }
  },
  {
    id: 'DYS_18',
    domain: 'literacy',
    subscale: 'VisualProc',
    scale: 'yes_no',
    text: {
      en: "Do you find forms difficult and confusing?",
      fr: "Trouvez-vous les formulaires administratifs difficiles et confus ?"
    }
  },
  {
    id: 'DYS_19',
    domain: 'literacy',
    subscale: 'Visuospatial',
    scale: 'yes_no',
    text: {
      en: "Do you mix up bus numbers like 95 and 59?",
      fr: "Confondez-vous des numéros inversés (ex: 95 et 59) ?"
    }
  },
  {
    id: 'DYS_20',
    domain: 'literacy',
    subscale: 'DysMemory',
    scale: 'yes_no',
    text: {
      en: "Did you find it difficult to learn your multiplication tables at school?",
      fr: "Avez-vous eu du mal à apprendre vos tables de multiplication à l'école ?"
    }
  },

  {
    id: 'DYS_PRO_01',
    domain: 'literacy',
    subscale: 'WrittenLoad',
    scale: 'frequency_0_4',
    text: {
      en: "Do written instructions take much longer to process than spoken explanations?",
      fr: "Les instructions écrites prennent-elles beaucoup plus de temps à traiter que les explications orales ?"
    }
  },
  {
    id: 'DYS_PRO_02',
    domain: 'literacy',
    subscale: 'WrittenLoad',
    scale: 'frequency_0_4',
    text: {
      en: "Do long emails or documents feel overwhelming to you?",
      fr: "Les longs emails ou documents vous semblent-ils écrasants ?"
    }
  },
  {
    id: 'DYS_PRO_03',
    domain: 'literacy',
    subscale: 'WrittenLoad',
    scale: 'frequency_0_4',
    text: {
      en: "Do you reread the same text multiple times without retaining it?",
      fr: "Relisez-vous le même texte plusieurs fois sans le retenir ?"
    }
  },
  {
    id: 'DYS_PRO_04',
    domain: 'literacy',
    subscale: 'AdminFriction',
    scale: 'frequency_0_4',
    text: {
      en: "Do forms or administrative documents cause you stress or lead to avoidance?",
      fr: "Les formulaires ou documents administratifs provoquent-ils chez vous stress ou évitement ?"
    }
  },
  {
    id: 'DYS_PRO_05',
    domain: 'literacy',
    subscale: 'AdminFriction',
    scale: 'frequency_0_4',
    text: {
      en: "Do you avoid tasks mainly because they involve a lot of reading or writing?",
      fr: "Évitez-vous des tâches principalement car elles impliquent beaucoup de lecture ou d'écriture ?"
    }
  },
  {
    id: 'DYS_PRO_06',
    domain: 'literacy',
    subscale: 'WrittenLoad',
    scale: 'frequency_0_4',
    text: {
      en: "Do spelling or wording issues make you doubt your professional competence?",
      fr: "Les problèmes d'orthographe ou de formulation vous font-ils douter de votre compétence ?"
    }
  },
  {
    id: 'DYS_PRO_07',
    domain: 'literacy',
    subscale: 'VerbalPref',
    scale: 'frequency_0_4',
    text: {
      en: "Do you feel more capable explaining ideas verbally than in writing?",
      fr: "Vous sentez-vous plus capable d'expliquer des idées verbalement que par écrit ?"
    }
  },


  {
    id: 'DCD_C01',
    domain: 'coordination',
    subscale: 'child_FineMotor',
    scale: 'frequency_0_3',
    text: {
      en: "As a child, did you struggle with self-care tasks such as tying shoelaces, fastening buttons, or zips?",
      fr: "Enfant, aviez-vous du mal à faire vos lacets, boutonner ou utiliser des fermetures éclair ?"
    }
  },
  {
    id: 'DCD_C02',
    domain: 'coordination',
    subscale: 'child_FineMotor',
    scale: 'frequency_0_3',
    text: {
      en: "As a child, was it difficult to eat without getting dirty or spilling things?",
      fr: "Enfant, aviez-vous du mal à manger sans vous salir ou renverser des choses ?"
    }
  },
  {
    id: 'DCD_C03',
    domain: 'coordination',
    subscale: 'child_GrossMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Did you struggle to learn to ride a bike compared to your peers?",
      fr: "Avez-vous eu plus de mal que les autres à apprendre à faire du vélo ?"
    }
  },
  {
    id: 'DCD_C04',
    domain: 'coordination',
    subscale: 'child_Main',
    scale: 'frequency_0_3',
    text: {
      en: "Did you have difficulties playing team games (e.g., catching a ball, football)?",
      fr: "Aviez-vous des difficultés dans les jeux d'équipe (attraper une balle, football) ?"
    }
  },
  {
    id: 'DCD_C05',
    domain: 'coordination',
    subscale: 'child_FineMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Was your handwriting untidy, illegible, or painful to produce?",
      fr: "Votre écriture était-elle désordonnée, illisible ou douloureuse à produire ?"
    }
  },
  {
    id: 'DCD_C06',
    domain: 'coordination',
    subscale: 'child_GrossMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Were you considered clumsy, or did you often bump into objects/people?",
      fr: "Étiez-vous considéré(e) comme maladroit(e), ou vous cogniez-vous souvent ?"
    }
  },
  {
    id: 'DCD_C07',
    domain: 'coordination',
    subscale: 'child_Main',
    scale: 'frequency_0_3',
    text: {
      en: "Did you actively avoid sports or physical activities?",
      fr: "Évitiez-vous activement le sport ou les activités physiques ?"
    }
  },
  {
    id: 'DCD_C08',
    domain: 'coordination',
    subscale: 'child_FineMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Did you have trouble using scissors or other tools?",
      fr: "Aviez-vous du mal à utiliser des ciseaux ou d'autres outils ?"
    }
  },
  {
    id: 'DCD_C09',
    domain: 'coordination',
    subscale: 'child_Main',
    scale: 'frequency_0_3',
    text: {
      en: "Did you take longer to learn new motor skills than others?",
      fr: "Mettiez-vous plus de temps à apprendre de nouvelles habiletés motrices que les autres ?"
    }
  },
  {
    id: 'DCD_C10',
    domain: 'coordination',
    subscale: 'child_Main',
    scale: 'frequency_0_3',
    text: {
      en: "Did you feel different from your peers due to coordination issues?",
      fr: "Vous sentiez-vous différent(e) des autres à cause de problèmes de coordination ?"
    }
  },

  {
    id: 'DCD_A01',
    domain: 'coordination',
    subscale: 'adult_GrossMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Do you tend to drop objects (e.g., keys, phone, dishes)?",
      fr: "Avez-vous tendance à faire tomber des objets (clés, téléphone, vaisselle) ?"
    }
  },
  {
    id: 'DCD_A02',
    domain: 'coordination',
    subscale: 'adult_GrossMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Do you bump into door frames, furniture, or other people?",
      fr: "Vous cognez-vous dans les cadres de porte, les meubles ou les gens ?"
    }
  },
  {
    id: 'DCD_A03',
    domain: 'coordination',
    subscale: 'adult_Planning',
    scale: 'frequency_0_3',
    text: {
      en: "Is it difficult for you to organize your workspace or pack a suitcase efficiently?",
      fr: "Trouvez-vous difficile d'organiser votre espace de travail ou de faire une valise efficacement ?"
    }
  },
  {
    id: 'DCD_A04',
    domain: 'coordination',
    subscale: 'adult_Planning',
    scale: 'frequency_0_3',
    text: {
      en: "Do you avoid driving, or find parking and judging distances difficult?",
      fr: "Évitez-vous de conduire, ou trouvez-vous difficile de vous garer et de juger les distances ?"
    }
  },
  {
    id: 'DCD_A05',
    domain: 'coordination',
    subscale: 'adult_FineMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Is your handwriting difficult to read or painful to produce for long periods?",
      fr: "Votre écriture est-elle difficile à lire ou douloureuse sur de longues périodes ?"
    }
  },
  {
    id: 'DCD_A06',
    domain: 'coordination',
    subscale: 'adult_FineMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Do you find tasks requiring precision (e.g., shaving, makeup, DIY) difficult?",
      fr: "Trouvez-vous les tâches de précision (rasage, maquillage, bricolage) difficiles ?"
    }
  },
  {
    id: 'DCD_A07',
    domain: 'coordination',
    subscale: 'adult_FineMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Do you spill drinks or food when eating?",
      fr: "Renversez-vous des boissons ou de la nourriture en mangeant ?"
    }
  },
  {
    id: 'DCD_A08',
    domain: 'coordination',
    subscale: 'adult_GrossMotor',
    scale: 'frequency_0_3',
    text: {
      en: "Do you feel you lack energy or fatigue easily due to the effort of physical tasks?",
      fr: "Ressentez-vous un manque d'énergie ou une fatigue rapide due à l'effort physique ?"
    }
  },
  {
    id: 'DCD_A09',
    domain: 'coordination',
    subscale: 'adult_Planning',
    scale: 'frequency_0_3',
    text: {
      en: "Do you have trouble planning the sequence of steps needed to complete a practical task?",
      fr: "Avez-vous du mal à planifier les étapes pour une tâche pratique (ex: cuisiner) ?"
    }
  },
  {
    id: 'DCD_A10',
    domain: 'coordination',
    subscale: 'adult_Planning',
    scale: 'frequency_0_3',
    text: {
      en: "Do you choose hobbies or jobs that require little physical coordination?",
      fr: "Choisissez-vous des loisirs ou emplois demandant peu de coordination physique ?"
    }
  },
  {
    id: 'DCD_COG_01',
    domain: 'coordination',
    subscale: 'ExecutionGap',
    scale: 'frequency_0_3',
    text: {
      en: "Do tasks feel clear in your head but fall apart when you try to execute them physically?",
      fr: "Les tâches semblent-elles claires dans votre tête mais s'effondrent quand vous essayez de les exécuter physiquement ?"
    }
  },
  {
    id: 'DCD_COG_02',
    domain: 'coordination',
    subscale: 'PhysicalFatigue',
    scale: 'frequency_0_3',
    text: {
      en: "Does physical effort drain your mental energy faster than expected?",
      fr: "L'effort physique draine-t-il votre énergie mentale plus vite que prévu ?"
    }
  },


  {
    id: 'NUM_01',
    domain: 'numbers',
    subscale: 'NumberSense',
    scale: 'frequency_1_5',
    text: {
      en: "Do you have difficulty counting objects accurately (e.g., losing track)?",
      fr: "Avez-vous du mal à compter des objets avec précision (perdre le fil) ?"
    }
  },
  {
    id: 'NUM_02',
    domain: 'numbers',
    subscale: 'Subitizing',
    scale: 'frequency_1_5',
    text: {
      en: "Do you have to count items one-by-one rather than just 'seeing' how many there are?",
      fr: "Devez-vous compter les objets un par un plutôt que de voir instantanément le nombre ?"
    }
  },
  {
    id: 'NUM_03',
    domain: 'numbers',
    subscale: 'WorkingMemory',
    scale: 'frequency_1_5',
    text: {
      en: "Is it much harder for you to count backwards than forwards?",
      fr: "Trouvez-vous beaucoup plus dur de compter à rebours qu'à l'endroit ?"
    }
  },
  {
    id: 'NUM_04',
    domain: 'numbers',
    subscale: 'Estimation',
    scale: 'frequency_1_5',
    text: {
      en: "Do you find it difficult to estimate costs (e.g., shopping total)?",
      fr: "Trouvez-vous difficile d'estimer des coûts (ex: paner de courses) ?"
    }
  },

  {
    id: 'NUM_05',
    domain: 'numbers',
    subscale: 'Retrieval',
    scale: 'frequency_1_5',
    text: {
      en: "Do you have difficulty remembering basic math facts (e.g., tables)?",
      fr: "Avez-vous du mal à retenir les faits mathématiques de base ?"
    }
  },
  {
    id: 'NUM_06',
    domain: 'numbers',
    subscale: 'Arithmetic',
    scale: 'frequency_1_5',
    text: {
      en: "Do you rely on your fingers to do simple calculations?",
      fr: "Comptez-vous sur vos doigts pour faire des calculs simples ?"
    }
  },
  {
    id: 'NUM_07',
    domain: 'numbers',
    subscale: 'Symbols',
    scale: 'frequency_1_5',
    text: {
      en: "Do you confuse mathematical symbols (e.g., + and x)?",
      fr: "Confondez-vous les symboles mathématiques (ex: + et x) ?"
    }
  },
  {
    id: 'NUM_08',
    domain: 'numbers',
    subscale: 'Arithmetic',
    scale: 'frequency_1_5',
    text: {
      en: "When adding, do you count 1, 2, 3... rather than counting on from the larger number?",
      fr: "Pour additionner, comptez-vous unité par unité au lieu de partir du grand nombre ?"
    }
  },

  {
    id: 'NUM_09',
    domain: 'numbers',
    subscale: 'Functional',
    scale: 'frequency_1_5',
    text: {
      en: "Do you struggle to tell the time on an analog clock?",
      fr: "Avez-vous du mal à lire l'heure sur une horloge analogique ?"
    }
  },
  {
    id: 'NUM_10',
    domain: 'numbers',
    subscale: 'Anxiety',
    scale: 'frequency_1_5',
    text: {
      en: "Do you get anxiety immediately when asked to do a math problem?",
      fr: "Ressentez-vous de l'anxiété immédiate face à un problème de maths ?"
    }
  },
  {
    id: 'NUM_11',
    domain: 'numbers',
    subscale: 'Functional',
    scale: 'frequency_1_5',
    text: {
      en: "Do you misread numbers (e.g., reading 51 as 15)?",
      fr: "Lisez-vous les nombres de travers (ex: 51 lu 15) ?"
    }
  },
  {
    id: 'NUM_12',
    domain: 'numbers',
    subscale: 'MentalMath',
    scale: 'frequency_1_5',
    text: {
      en: "Do you find mental math (e.g., calculating change) difficult or impossible?",
      fr: "Trouvez-vous le calcul mental (ex: rendre la monnaie) difficile ?"
    }
  },
  {
    id: 'NUM_13',
    domain: 'numbers',
    subscale: 'MathMemory',
    scale: 'frequency_1_5',
    text: {
      en: "Do you forget PIN numbers or phone numbers?",
      fr: "Oubliez-vous vos codes PIN ou numéros de téléphone ?"
    }
  },
  {
    id: 'NUM_14',
    domain: 'numbers',
    subscale: 'Estimation',
    scale: 'frequency_1_5',
    text: {
      en: "Do you drive too fast or slow because you misjudge speed/distance?",
      fr: "Conduisez-vous mal (vitesse) car vous jugez mal la distance ?"
    }
  },
  {
    id: 'NUM_15',
    domain: 'numbers',
    subscale: 'Functional',
    scale: 'frequency_1_5',
    text: {
      en: "Do you find financial planning or budgeting impossible to understand?",
      fr: "Trouvez-vous la planification financière impossible à comprendre ?"
    }
  },

  {
    id: 'NUM_TM_01',
    domain: 'numbers',
    subscale: 'TimeMoney',
    scale: 'frequency_1_5',
    text: {
      en: "Do deadlines or time estimates feel abstract or confusing?",
      fr: "Les délais ou estimations de temps vous semblent-ils abstraits ou confus ?"
    }
  },
  {
    id: 'NUM_TM_02',
    domain: 'numbers',
    subscale: 'TimeMoney',
    scale: 'frequency_1_5',
    text: {
      en: "Do schedules or timelines fail to make intuitive sense to you?",
      fr: "Les plannings ou chronologies manquent-ils de sens intuitif pour vous ?"
    }
  },
  {
    id: 'NUM_TM_03',
    domain: 'numbers',
    subscale: 'TimeMoney',
    scale: 'frequency_1_5',
    text: {
      en: "Do numbers lose meaning unless they are visualized?",
      fr: "Les chiffres perdent-ils leur sens à moins d'être visualisés ?"
    }
  },
  {
    id: 'NUM_TM_04',
    domain: 'numbers',
    subscale: 'Financial',
    scale: 'frequency_1_5',
    text: {
      en: "Does budgeting or financial planning feel impossible to grasp?",
      fr: "La budgétisation ou la planification financière vous semblent-elles impossibles à saisir ?"
    }
  },
  {
    id: 'NUM_TM_05',
    domain: 'numbers',
    subscale: 'TimeMoney',
    scale: 'frequency_1_5',
    text: {
      en: "Do you avoid tasks involving numbers, even simple ones?",
      fr: "Évitez-vous les tâches impliquant des chiffres, même simples ?"
    }
  },
  {
    id: 'NUM_TM_06',
    domain: 'numbers',
    subscale: 'Financial',
    scale: 'frequency_1_5',
    text: {
      en: "Do you feel anxious when dealing with quantities, prices, or time pressure?",
      fr: "Vous sentez-vous anxieux(se) face à des quantités, prix ou pression temporelle ?"
    }
  }
];
