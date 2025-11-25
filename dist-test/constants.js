import { NeuroType, Situation } from './types';
export const INITIAL_EXERCISES = [
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
        imageUrl: '/images/exercises/resp-478.svg',
        tags: ['Respiration', 'Vagal', 'Sommeil'],
        thanksCount: 120,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/ice-dive.svg',
        tags: ['Urgence', 'Bio-hack', 'Froid'],
        thanksCount: 85,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/wall-push.svg',
        tags: ['Décharge', 'Colère', 'Proprioception'],
        thanksCount: 64,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/butterfly-hug.svg',
        tags: ['EMDR', 'Sécurité', 'Toucher'],
        thanksCount: 143,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/shaking.svg',
        tags: ['Somatic', 'TRE', 'Mouvement'],
        thanksCount: 92,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/physio-sigh.svg',
        tags: ['Respiration', 'Science', 'Rapide'],
        thanksCount: 110,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/54321.svg',
        tags: ['Cognitif', 'Sensoriel', 'Dissociation'],
        thanksCount: 150,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/voo-sound.svg',
        tags: ['Vagal', 'Son', 'Vibration'],
        thanksCount: 45,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/psoas-release.svg',
        tags: ['Douleur', 'Posture', 'Détente'],
        thanksCount: 78,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/brain-dump.svg',
        tags: ['Cognitif', 'Organisation', 'Ecriture'],
        thanksCount: 112,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/visual-countdown.svg',
        tags: ['Visualisation', 'Sommeil', 'Mental'],
        thanksCount: 56,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/self-hug.svg',
        tags: ['Proprioception', 'Sécurité', 'Toucher'],
        thanksCount: 88,
        moderationStatus: 'approved'
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
        imageUrl: '/images/exercises/pmr-jacobson.svg',
        tags: ['Corps', 'Détente', 'Sommeil'],
        thanksCount: 72,
        moderationStatus: 'approved'
    }
];
