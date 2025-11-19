import { Exercise, NeuroType, Situation } from './types';

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: 'resp-478',
    title: 'Respiration 4-7-8',
    description: 'Une technique respiratoire puissante pour activer le système parasympathique et stopper l\'anxiété ou favoriser le sommeil.',
    situation: [Situation.Sleep, Situation.Rumination, Situation.Stress],
    neurotypes: [NeuroType.ADHD, NeuroType.Trauma, NeuroType.ASD],
    duration: '2-5 minutes',
    steps: [
      'Inspirez par le nez doucement pendant 4 secondes.',
      'Retenez votre respiration pendant 7 secondes (tolérance CO2).',
      'Expirez bruyamment par la bouche pendant 8 secondes.',
      'Répétez le cycle 4 fois.'
    ],
    imageUrl: 'https://placehold.co/600x400/2dd4bf/ffffff?text=Respiration+4-7-8',
    tags: ['Respiration', 'Vagal', 'Sommeil'],
    thanksCount: 120
  },
  {
    id: 'ice-dive',
    title: 'Réflexe de Plongée (Ice Dive)',
    description: 'Un "Reset" brutal mais efficace pour stopper une crise de panique immédiate via le réflexe mammalien de plongée.',
    situation: [Situation.Crisis, Situation.Anger],
    neurotypes: [NeuroType.Trauma, NeuroType.ASD],
    duration: '30 secondes',
    steps: [
      'Remplissez une bassine d\'eau très froide ou prenez un sac de glace.',
      'Retenez votre respiration.',
      'Plongez le visage (zones naso-labiales) dans l\'eau ou appliquez la glace sur le haut du visage.',
      'Maintenez 30 secondes.',
      'Observez le ralentissement immédiat du cœur.'
    ],
    warning: 'Attention si vous avez des problèmes cardiaques préexistants.',
    imageUrl: 'https://placehold.co/600x400/3b82f6/ffffff?text=Reflexe+Plongee',
    tags: ['Urgence', 'Bio-hack', 'Froid'],
    thanksCount: 85
  },
  {
    id: 'wall-push',
    title: 'La Poussée Murale',
    description: 'Décharger l\'énergie sympathique (combat) de manière sécurisée sans violence. Idéal pour l\'agressivité saine.',
    situation: [Situation.Anger, Situation.Stress],
    neurotypes: [NeuroType.ADHD, NeuroType.Trauma],
    duration: '1-2 minutes',
    steps: [
      'Mettez-vous face à un mur solide en fente (une jambe devant).',
      'Posez les mains à plat et poussez de toutes vos forces comme pour déplacer le bâtiment.',
      'Engagez les abdos et les jambes.',
      'Visualisez que vous repoussez une menace ou une injustice.',
      'Relâchez quand les muscles tremblent et sentez l\'espace créé.'
    ],
    imageUrl: 'https://placehold.co/600x400/f43f5e/ffffff?text=Poussee+Murale',
    tags: ['Décharge', 'Colère', 'Proprioception'],
    thanksCount: 64
  },
  {
    id: 'butterfly-hug',
    title: 'Le Câlin Papillon',
    description: 'Technique issue de l\'EMDR pour traiter les émotions intenses et créer un sentiment de sécurité.',
    situation: [Situation.Crisis, Situation.Stress, Situation.Trauma],
    neurotypes: [NeuroType.Trauma, NeuroType.ASD],
    duration: '2-3 minutes',
    steps: [
      'Croisez les bras sur la poitrine.',
      'Posez vos mains sur vos épaules ou bras opposés.',
      'Tapotez alternativement gauche/droite doucement, comme le battement d\'ailes d\'un papillon.',
      'Respirez lentement et profondément.',
      'Observez vos sensations sans jugement.'
    ],
    imageUrl: 'https://placehold.co/600x400/d946ef/ffffff?text=Calin+Papillon',
    tags: ['EMDR', 'Sécurité', 'Toucher'],
    thanksCount: 143
  },
  {
    id: 'shaking',
    title: 'Secousses (Shaking/TRE)',
    description: 'Inspiré du comportement animal pour évacuer le stress traumatique stocké dans les fascias.',
    situation: [Situation.Freeze, Situation.Stress],
    neurotypes: [NeuroType.Trauma, NeuroType.ADHD],
    duration: '1-3 minutes',
    steps: [
      'Debout, commencez par secouer les mains.',
      'Secouez les bras, les épaules, faites rebondir les talons.',
      'Faites le son "Brrr" avec les lèvres.',
      'Laissez le corps trembler de manière désordonnée.',
      'Arrêtez brusquement et sentez l\'énergie circuler.'
    ],
    warning: 'En cas de trauma complexe, ne pratiquez pas le tremblement au sol seul trop longtemps. Arrêtez si submergé.',
    imageUrl: 'https://placehold.co/600x400/eab308/ffffff?text=Shaking',
    tags: ['Somatic', 'TRE', 'Mouvement'],
    thanksCount: 92
  },
  {
    id: 'physio-sigh',
    title: 'Soupir Physiologique',
    description: 'La méthode la plus rapide scientifiquement prouvée pour réduire le stress en temps réel (A. Huberman).',
    situation: [Situation.Stress, Situation.Crisis, Situation.Focus],
    neurotypes: [NeuroType.ADHD, NeuroType.HighSensitivity],
    duration: '1 minute',
    steps: [
      'Prenez une inspiration profonde par le nez.',
      'À la fin de l\'inspiration, reprenez une petite inspiration sèche par le nez (pour gonfler les alvéoles).',
      'Expirez très longuement par la bouche.',
      'Répétez 3 à 5 fois.'
    ],
    imageUrl: 'https://placehold.co/600x400/14b8a6/ffffff?text=Soupir+Physio',
    tags: ['Respiration', 'Science', 'Rapide'],
    thanksCount: 110
  },
  {
    id: '54321',
    title: 'Ancrage 5-4-3-2-1',
    description: 'Technique cognitive et sensorielle pour reconnecter le cortex préfrontal en cas de dissociation ou dépersonnalisation.',
    situation: [Situation.Freeze, Situation.Crisis],
    neurotypes: [NeuroType.Trauma, NeuroType.ASD],
    duration: '2 minutes',
    steps: [
      'Nommez 5 choses que vous voyez.',
      'Nommez 4 choses que vous pouvez toucher (textures).',
      'Nommez 3 choses que vous entendez.',
      'Nommez 2 choses que vous sentez (olfaction).',
      'Nommez 1 chose que vous pouvez goûter.'
    ],
    imageUrl: 'https://placehold.co/600x400/a855f7/ffffff?text=Grounding+54321',
    tags: ['Cognitif', 'Sensoriel', 'Dissociation'],
    thanksCount: 150
  },
  {
    id: 'voo-sound',
    title: 'Le Son "Voo"',
    description: 'Stimulation du nerf vague par vibration laryngée pour calmer la "boule au ventre".',
    situation: [Situation.Freeze, Situation.Stress],
    neurotypes: [NeuroType.Trauma, NeuroType.ASD],
    duration: '2 minutes',
    steps: [
      'Inspirez profondément.',
      'À l\'expiration, faites un son grave "Voooo" (comme une corne de brume).',
      'Faites vibrer la poitrine et le ventre.',
      'Attendez que l\'inspiration revienne d\'elle-même.',
      'Répétez 3 à 5 fois.'
    ],
    imageUrl: 'https://placehold.co/600x400/6366f1/ffffff?text=Son+Voo',
    tags: ['Vagal', 'Son', 'Vibration'],
    thanksCount: 45
  },
  {
    id: 'psoas-release',
    title: 'Repos Constructif (Psoas)',
    description: 'Posture passive pour relâcher le "muscle de la peur" (Psoas) qui stocke les traumas.',
    situation: [Situation.Pain, Situation.Stress, Situation.Sleep],
    neurotypes: [NeuroType.Trauma, NeuroType.ADHD],
    duration: '10-15 minutes',
    steps: [
      'Allongez-vous sur le dos.',
      'Pliez les genoux à 90 degrés, pieds à plat au sol écartés à la largeur des hanches.',
      'Ou posez les mollets sur une chaise.',
      'Laissez la gravité faire fondre le bas du dos dans le sol.',
      'Ne faites rien d\'autre (pas de téléphone).'
    ],
    imageUrl: 'https://placehold.co/600x400/10b981/ffffff?text=Repos+Constructif',
    tags: ['Douleur', 'Posture', 'Détente'],
    thanksCount: 78
  },
  {
    id: 'brain-dump',
    title: 'Décharge Mentale (Brain Dump)',
    description: 'Externaliser la mémoire de travail saturée pour arrêter les ruminations ("Hamster").',
    situation: [Situation.Rumination, Situation.Focus],
    neurotypes: [NeuroType.ADHD, NeuroType.ASD],
    duration: '5 minutes',
    steps: [
      'Prenez un papier et un crayon.',
      'Écrivez tous les mots, tâches, ou pensées en vrac, sans structure.',
      'Dessinez le chaos si les mots manquent.',
      'Une fois sur papier, dites à votre cerveau : "C\'est noté, tu peux lâcher".'
    ],
    imageUrl: 'https://placehold.co/600x400/64748b/ffffff?text=Brain+Dump',
    tags: ['Cognitif', 'Organisation', 'Ecriture'],
    thanksCount: 112
  },
  {
    id: 'visual-countdown',
    title: 'Compte à Rebours Visuel',
    description: 'Occuper le cortex visuel pour empêcher les images anxiogènes et induire le sommeil.',
    situation: [Situation.Sleep, Situation.Rumination],
    neurotypes: [NeuroType.ADHD, NeuroType.HighSensitivity],
    duration: 'Variable',
    steps: [
      'Fermez les yeux.',
      'Visualisez le chiffre 100 qui s\'écrit ou se dessine.',
      'Voyez-le s\'effacer lentement.',
      'Visualisez le chiffre 99.',
      'Si une pensée intrusives arrive, recommencez doucement.'
    ],
    imageUrl: 'https://placehold.co/600x400/0f172a/ffffff?text=Compte+Rebours',
    tags: ['Visualisation', 'Sommeil', 'Mental'],
    thanksCount: 56
  },
  {
    id: 'self-hug',
    title: 'Auto-Étreinte (Contenant)',
    description: 'Redéfinir les limites corporelles pour se sentir contenu et en sécurité.',
    situation: [Situation.Stress, Situation.Freeze],
    neurotypes: [NeuroType.ASD, NeuroType.Trauma],
    duration: '1 minute',
    steps: [
      'Croisez les bras.',
      'Placez la main droite sous l\'aisselle gauche.',
      'Placez la main gauche sur l\'épaule droite.',
      'Pressez fermement.',
      'Sentez vos limites : "Je commence ici, je m\'arrête là".'
    ],
    imageUrl: 'https://placehold.co/600x400/ec4899/ffffff?text=Self+Hug',
    tags: ['Proprioception', 'Sécurité', 'Toucher'],
    thanksCount: 88
  },
  {
    id: 'pmr-jacobson',
    title: 'Relaxation Musculaire (Jacobson)',
    description: 'Contracter puis relâcher les muscles pour sentir la différence entre tension et détente.',
    situation: [Situation.Stress, Situation.Sleep, Situation.Pain],
    neurotypes: [NeuroType.ADHD, NeuroType.HighSensitivity],
    duration: '5-10 minutes',
    steps: [
      'Serrez fort les poings pendant 5 secondes. Relâchez brusquement.',
      'Haussez les épaules vers les oreilles (5s). Relâchez.',
      'Contractez les fessiers et les jambes (5s). Relâchez.',
      'Sentez la vague de chaleur qui suit le relâchement.'
    ],
    imageUrl: 'https://placehold.co/600x400/8b5cf6/ffffff?text=Relaxation+Musculaire',
    tags: ['Corps', 'Détente', 'Sommeil'],
    thanksCount: 72
  }
];