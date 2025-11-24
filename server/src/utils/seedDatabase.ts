import { randomUUID } from 'node:crypto';
import { pool } from '../db.js';

// Initial exercises data (hardcoded to avoid circular dependencies)
const INITIAL_EXERCISES = [
  {
    id: 'resp-478',
    title: 'Respiration 4-7-8',
    description: 'Une technique respiratoire puissante pour activer le système parasympathique et stopper l\'anxiété ou favoriser le sommeil.',
    situation: ['Sleep', 'Rumination', 'Stress'],
    neurotypes: ['ADHD', 'Trauma', 'ASD'],
    duration: '2-5 minutes',
    steps: [
      'Inspirez par le nez doucement pendant 4 secondes.',
      'Retenez votre respiration pendant 7 secondes (tolérance CO2).',
      'Expirez bruyamment par la bouche pendant 8 secondes.',
      'Répétez le cycle 4 fois.'
    ],
    imageUrl: 'https://placehold.co/600x400/2dd4bf/ffffff?text=Respiration+4-7-8',
    tags: ['Respiration', 'Vagal', 'Sommeil'],
    thanksCount: 120,
    moderationStatus: 'approved'
  },
  {
    id: 'ice-dive',
    title: 'Réflexe de Plongée (Ice Dive)',
    description: 'Un "Reset" brutal mais efficace pour stopper une crise de panique immédiate via le réflexe mammalien de plongée.',
    situation: ['Crisis', 'Anger'],
    neurotypes: ['Trauma', 'ASD'],
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
    thanksCount: 85,
    moderationStatus: 'approved'
  },
  {
    id: 'wall-push',
    title: 'La Poussée Murale',
    description: 'Décharger l\'énergie sympathique (combat) de manière sécurisée sans violence. Idéal pour l\'agressivité saine.',
    situation: ['Anger', 'Stress'],
    neurotypes: ['ADHD', 'Trauma'],
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
    thanksCount: 64,
    moderationStatus: 'approved'
  },
  {
    id: 'butterfly-hug',
    title: 'Le Câlin Papillon',
    description: 'Technique issue de l\'EMDR pour traiter les émotions intenses et créer un sentiment de sécurité.',
    situation: ['Crisis', 'Stress', 'Trauma'],
    neurotypes: ['Trauma', 'ASD'],
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
    thanksCount: 143,
    moderationStatus: 'approved'
  },
  {
    id: 'shaking',
    title: 'Secousses (Shaking/TRE)',
    description: 'Inspiré du comportement animal pour évacuer le stress traumatique stocké dans les fascias.',
    situation: ['Freeze', 'Stress'],
    neurotypes: ['Trauma', 'ADHD'],
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
    thanksCount: 92,
    moderationStatus: 'approved'
  },
  {
    id: 'physio-sigh',
    title: 'Soupir Physiologique',
    description: 'La méthode la plus rapide scientifiquement prouvée pour réduire le stress en temps réel (A. Huberman).',
    situation: ['Stress', 'Crisis', 'Focus'],
    neurotypes: ['ADHD', 'HighSensitivity'],
    duration: '1 minute',
    steps: [
      'Prenez une inspiration profonde par le nez.',
      'À la fin de l\'inspiration, reprenez une petite inspiration sèche par le nez (pour gonfler les alvéoles).',
      'Expirez très longuement par la bouche.',
      'Répétez 3 à 5 fois.'
    ],
    imageUrl: 'https://placehold.co/600x400/14b8a6/ffffff?text=Soupir+Physio',
    tags: ['Respiration', 'Science', 'Rapide'],
    thanksCount: 110,
    moderationStatus: 'approved'
  },
  {
    id: '54321',
    title: 'Ancrage 5-4-3-2-1',
    description: 'Technique cognitive et sensorielle pour reconnecter le cortex préfrontal en cas de dissociation ou dépersonnalisation.',
    situation: ['Freeze', 'Crisis'],
    neurotypes: ['Trauma', 'ASD'],
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
    thanksCount: 150,
    moderationStatus: 'approved'
  },
  {
    id: 'voo-sound',
    title: 'Le Son "Voo"',
    description: 'Stimulation du nerf vague par vibration laryngée pour calmer la "boule au ventre".',
    situation: ['Freeze', 'Stress'],
    neurotypes: ['Trauma', 'ASD'],
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
    thanksCount: 45,
    moderationStatus: 'approved'
  },
  {
    id: 'psoas-release',
    title: 'Repos Constructif (Psoas)',
    description: 'Posture passive pour relâcher le "muscle de la peur" (Psoas) qui stocke les traumas.',
    situation: ['Pain', 'Stress', 'Sleep'],
    neurotypes: ['Trauma', 'ADHD'],
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
    thanksCount: 78,
    moderationStatus: 'approved'
  },
  {
    id: 'brain-dump',
    title: 'Décharge Mentale (Brain Dump)',
    description: 'Externaliser la mémoire de travail saturée pour arrêter les ruminations ("Hamster").',
    situation: ['Rumination', 'Focus'],
    neurotypes: ['ADHD', 'ASD'],
    duration: '5 minutes',
    steps: [
      'Prenez un papier et un crayon.',
      'Écrivez tous les mots, tâches, ou pensées en vrac, sans structure.',
      'Dessinez le chaos si les mots manquent.',
      'Une fois sur papier, dites à votre cerveau : "C\'est noté, tu peux lâcher".'
    ],
    imageUrl: 'https://placehold.co/600x400/64748b/ffffff?text=Brain+Dump',
    tags: ['Cognitif', 'Organisation', 'Ecriture'],
    thanksCount: 112,
    moderationStatus: 'approved'
  },
  {
    id: 'visual-countdown',
    title: 'Compte à Rebours Visuel',
    description: 'Occuper le cortex visuel pour empêcher les images anxiogènes et induire le sommeil.',
    situation: ['Sleep', 'Rumination'],
    neurotypes: ['ADHD', 'HighSensitivity'],
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
    thanksCount: 56,
    moderationStatus: 'approved'
  },
  {
    id: 'self-hug',
    title: 'Auto-Étreinte (Contenant)',
    description: 'Redéfinir les limites corporelles pour se sentir contenu et en sécurité.',
    situation: ['Stress', 'Freeze'],
    neurotypes: ['ASD', 'Trauma'],
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
    thanksCount: 88,
    moderationStatus: 'approved'
  },
  {
    id: 'pmr-jacobson',
    title: 'Relaxation Musculaire (Jacobson)',
    description: 'Contracter puis relâcher les muscles pour sentir la différence entre tension et détente.',
    situation: ['Stress', 'Sleep', 'Pain'],
    neurotypes: ['ADHD', 'HighSensitivity'],
    duration: '5-10 minutes',
    steps: [
      'Serrez fort les poings pendant 5 secondes. Relâchez brusquement.',
      'Haussez les épaules vers les oreilles (5s). Relâchez.',
      'Contractez les fessiers et les jambes (5s). Relâchez.',
      'Sentez la vague de chaleur qui suit le relâchement.'
    ],
    imageUrl: 'https://placehold.co/600x400/8b5cf6/ffffff?text=Relaxation+Musculaire',
    tags: ['Corps', 'Détente', 'Sommeil'],
    thanksCount: 72,
    moderationStatus: 'approved'
  }
];

/**
 * Check if the exercises table is empty
 */
async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM exercises WHERE deleted_at IS NULL');
    const count = parseInt(result.rows[0].count, 10);
    return count === 0;
  } catch (error) {
    console.error('Error checking database:', error);
    return false;
  }
}

/**
 * Insert initial exercises into the database
 */
async function seedExercises(): Promise<void> {
  console.log(`📝 Seeding ${INITIAL_EXERCISES.length} initial exercises...`);
  
  for (const exercise of INITIAL_EXERCISES) {
    const id = randomUUID();
    const now = new Date();
    
    try {
      await pool.query(
        `INSERT INTO exercises (
          id, client_id, title, description, situation, neurotypes, duration, steps,
          warning, image_url, tags, thanks_count, is_partner_content,
          is_community_submitted, moderation_status, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        )`,
        [
          id,
          exercise.id, // Use original ID as client_id for tracking
          exercise.title,
          exercise.description,
          exercise.situation,
          exercise.neurotypes,
          exercise.duration,
          exercise.steps,
          exercise.warning || null,
          exercise.imageUrl,
          exercise.tags,
          exercise.thanksCount || 0,
          false, // is_partner_content
          false, // is_community_submitted (these are official seed exercises)
          exercise.moderationStatus || 'approved',
          now,
          now
        ]
      );
    } catch (error) {
      console.error(`Failed to insert exercise ${exercise.id}:`, error);
    }
  }
  
  console.log('✅ Initial exercises seeded successfully');
}

/**
 * Seed database if empty (runs on server startup)
 */
export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    const isEmpty = await isDatabaseEmpty();
    
    if (isEmpty) {
      console.log('📦 Database is empty. Seeding initial data...');
      await seedExercises();
    } else {
      console.log('✅ Database already contains exercises. Skipping seed.');
    }
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    throw error;
  }
}
