/**
 * Seed Exercise Strings Script
 * Migrates INITIAL_EXERCISES from constants.ts to the string-based translation system
 * 
 * Usage:
 *   tsx scripts/seedExerciseStrings.ts
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: process.env.SERVER_ENV ?? process.env.ENV_FILE });

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/neurobox';
const pool = new Pool({ connectionString: DATABASE_URL });

// INITIAL_EXERCISES embedded inline (copied from seedInitialData.ts)
const INITIAL_EXERCISES = [
  {
    id: 'resp-478',
    title: 'Respiration 4-7-8',
    description: 'Une technique respiratoire puissante pour activer le système parasympathique et stopper l\'anxiété ou favoriser le sommeil.',
    steps: [
      'Inspirez par le nez doucement pendant 4 secondes.',
      'Retenez votre respiration pendant 7 secondes (tolérance CO2).',
      'Expirez bruyamment par la bouche pendant 8 secondes.',
      'Répétez le cycle 4 fois.'
    ],
    warning: undefined
  },
  {
    id: 'ice-dive',
    title: 'Réflexe de Plongée (Ice Dive)',
    description: 'Un "Reset" brutal mais efficace pour stopper une crise de panique immédiate via le réflexe mammalien de plongée.',
    steps: [
      'Remplissez une bassine d\'eau très froide ou prenez un sac de glace.',
      'Retenez votre respiration.',
      'Plongez le visage (zones naso-labiales) dans l\'eau ou appliquez la glace sur le haut du visage.',
      'Maintenez 30 secondes.',
      'Observez le ralentissement immédiat du cœur.'
    ],
    warning: 'Attention si vous avez des problèmes cardiaques préexistants.'
  },
  {
    id: 'wall-push',
    title: 'La Poussée Murale',
    description: 'Décharger l\'énergie sympathique (combat) de manière sécurisée sans violence. Idéal pour l\'agressivité saine.',
    steps: [
      'Mettez-vous face à un mur solide en fente (une jambe devant).',
      'Posez les mains à plat et poussez de toutes vos forces comme pour déplacer le bâtiment.',
      'Engagez les abdos et les jambes.',
      'Visualisez que vous repoussez une menace ou une injustice.',
      'Relâchez quand les muscles tremblent et sentez l\'espace créé.'
    ],
    warning: undefined
  },
  {
    id: 'butterfly-hug',
    title: 'Le Câlin Papillon',
    description: 'Technique issue de l\'EMDR pour traiter les émotions intenses et créer un sentiment de sécurité.',
    steps: [
      'Croisez les bras sur la poitrine.',
      'Posez vos mains sur vos épaules ou bras opposés.',
      'Tapotez alternativement gauche/droite doucement, comme le battement d\'ailes d\'un papillon.',
      'Respirez lentement et profondément.',
      'Observez vos sensations sans jugement.'
    ],
    warning: undefined
  },
  {
    id: 'shaking',
    title: 'Secousses (Shaking/TRE)',
    description: 'Inspiré du comportement animal pour évacuer le stress traumatique stocké dans les fascias.',
    steps: [
      'Debout, commencez par secouer les mains.',
      'Secouez les bras, les épaules, faites rebondir les talons.',
      'Faites le son "Brrr" avec les lèvres.',
      'Laissez le corps trembler de manière désordonnée.',
      'Arrêtez brusquement et sentez l\'énergie circuler.'
    ],
    warning: 'En cas de trauma complexe, ne pratiquez pas le tremblement au sol seul trop longtemps. Arrêtez si submergé.'
  },
  {
    id: 'physio-sigh',
    title: 'Soupir Physiologique',
    description: 'La méthode la plus rapide scientifiquement prouvée pour réduire le stress en temps réel (A. Huberman).',
    steps: [
      'Prenez une inspiration profonde par le nez.',
      'À la fin de l\'inspiration, reprenez une petite inspiration sèche par le nez (pour gonfler les alvéoles).',
      'Expirez très longuement par la bouche.',
      'Répétez 3 à 5 fois.'
    ],
    warning: undefined
  },
  {
    id: '54321',
    title: 'Ancrage 5-4-3-2-1',
    description: 'Technique cognitive et sensorielle pour reconnecter le cortex préfrontal en cas de dissociation ou dépersonnalisation.',
    steps: [
      'Nommez 5 choses que vous voyez.',
      'Nommez 4 choses que vous pouvez toucher (textures).',
      'Nommez 3 choses que vous entendez.',
      'Nommez 2 choses que vous sentez (olfaction).',
      'Nommez 1 chose que vous pouvez goûter.'
    ],
    warning: undefined
  },
  {
    id: 'voo-sound',
    title: 'Le Son "Voo"',
    description: 'Stimulation du nerf vague par vibration laryngée pour calmer la "boule au ventre".',
    steps: [
      'Inspirez profondément.',
      'À l\'expiration, faites un son grave "Voooo" (comme une corne de brume).',
      'Faites vibrer la poitrine et le ventre.',
      'Attendez que l\'inspiration revienne d\'elle-même.',
      'Répétez 3 à 5 fois.'
    ],
    warning: undefined
  },
  {
    id: 'psoas-release',
    title: 'Repos Constructif (Psoas)',
    description: 'Posture passive pour relâcher le "muscle de la peur" (Psoas) qui stocke les traumas.',
    steps: [
      'Allongez-vous sur le dos.',
      'Pliez les genoux à 90 degrés, pieds à plat au sol écartés à la largeur des hanches.',
      'Ou posez les mollets sur une chaise.',
      'Laissez la gravité faire fondre le bas du dos dans le sol.',
      'Ne faites rien d\'autre (pas de téléphone).'
    ],
    warning: undefined
  },
  {
    id: 'brain-dump',
    title: 'Décharge Mentale (Brain Dump)',
    description: 'Externaliser la mémoire de travail saturée pour arrêter les ruminations ("Hamster").',
    steps: [
      'Prenez un papier et un crayon.',
      'Écrivez tous les mots, tâches, ou pensées en vrac, sans structure.',
      'Dessinez le chaos si les mots manquent.',
      'Une fois sur papier, dites à votre cerveau : "C\'est noté, tu peux lâcher".'
    ],
    warning: undefined
  },
  {
    id: 'visual-countdown',
    title: 'Compte à Rebours Visuel',
    description: 'Occuper le cortex visuel pour empêcher les images anxiogènes et induire le sommeil.',
    steps: [
      'Fermez les yeux.',
      'Visualisez le chiffre 100 qui s\'écrit ou se dessine.',
      'Voyez-le s\'effacer lentement.',
      'Visualisez le chiffre 99.',
      'Si une pensée intrusives arrive, recommencez doucement.'
    ],
    warning: undefined
  },
  {
    id: 'self-hug',
    title: 'Auto-Étreinte (Contenant)',
    description: 'Redéfinir les limites corporelles pour se sentir contenu et en sécurité.',
    steps: [
      'Croisez les bras.',
      'Placez la main droite sous l\'aisselle gauche.',
      'Placez la main gauche sur l\'épaule droite.',
      'Pressez fermement.',
      'Sentez vos limites : "Je commence ici, je m\'arrête là".'
    ],
    warning: undefined
  },
  {
    id: 'pmr-jacobson',
    title: 'Relaxation Musculaire (Jacobson)',
    description: 'Contracter puis relâcher les muscles pour sentir la différence entre tension et détente.',
    steps: [
      'Serrez fort les poings pendant 5 secondes. Relâchez brusquement.',
      'Haussez les épaules vers les oreilles (5s). Relâchez.',
      'Contractez les fessiers et les jambes (5s). Relâchez.',
      'Sentez la vague de chaleur qui suit le relâchement.'
    ],
    warning: undefined
  }
];

interface ExerciseString {
  id: string;
  context: string;
  sourceText: string;
  sourceLang: string;
}

interface ExerciseTranslation {
  stringId: string;
  lang: string;
  translatedText: string;
  translationMethod: string;
}

/**
 * Generate string ID for exercise content
 */
function generateStringId(exerciseId: string, field: string, index?: number): string {
  const base = `exercise.${exerciseId}.${field}`;
  return index !== undefined ? `${base}_${index + 1}` : base;
}

/**
 * Extract strings from INITIAL_EXERCISES
 */
function extractStrings(): ExerciseString[] {
  const strings: ExerciseString[] = [];

  for (const exercise of INITIAL_EXERCISES) {
    // Title
    strings.push({
      id: generateStringId(exercise.id, 'title'),
      context: 'exercise',
      sourceText: exercise.title,
      sourceLang: 'fr'
    });

    // Description
    strings.push({
      id: generateStringId(exercise.id, 'description'),
      context: 'exercise',
      sourceText: exercise.description,
      sourceLang: 'fr'
    });

    // Steps
    exercise.steps.forEach((step, idx) => {
      strings.push({
        id: generateStringId(exercise.id, 'step', idx),
        context: 'exercise',
        sourceText: step,
        sourceLang: 'fr'
      });
    });

    // Warning (if exists)
    if (exercise.warning) {
      strings.push({
        id: generateStringId(exercise.id, 'warning'),
        context: 'exercise',
        sourceText: exercise.warning,
        sourceLang: 'fr'
      });
    }
  }

  return strings;
}

/**
 * Create French translations (source language)
 */
function createFrenchTranslations(strings: ExerciseString[]): ExerciseTranslation[] {
  return strings.map(str => ({
    stringId: str.id,
    lang: 'fr',
    translatedText: str.sourceText,
    translationMethod: 'source'
  }));
}

/**
 * Insert strings into database
 */
async function insertStrings(strings: ExerciseString[]): Promise<void> {
  console.log(`Inserting ${strings.length} exercise strings...`);
  
  for (const str of strings) {
    await pool.query(
      `INSERT INTO exercise_strings (id, context, source_text, source_lang)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         source_text = EXCLUDED.source_text,
         updated_at = NOW()`,
      [str.id, str.context, str.sourceText, str.sourceLang]
    );
  }
  
  console.log('✓ Strings inserted successfully');
}

/**
 * Insert translations into database
 */
async function insertTranslations(translations: ExerciseTranslation[]): Promise<void> {
  console.log(`Inserting ${translations.length} French translations...`);
  
  for (const trans of translations) {
    await pool.query(
      `INSERT INTO exercise_translations (string_id, lang, translated_text, translation_method)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (string_id, lang) DO UPDATE SET
         translated_text = EXCLUDED.translated_text,
         updated_at = NOW()`,
      [trans.stringId, trans.lang, trans.translatedText, trans.translationMethod]
    );
  }
  
  console.log('✓ Translations inserted successfully');
}

/**
 * Generate TypeScript code to update constants.ts with string IDs
 */
function generateConstantsUpdate(): void {
  console.log('\n=== Update constants.ts ===\n');
  console.log('Add the following string ID fields to each exercise in INITIAL_EXERCISES:\n');

  for (const exercise of INITIAL_EXERCISES) {
    const titleStringId = generateStringId(exercise.id, 'title');
    const descriptionStringId = generateStringId(exercise.id, 'description');
    const stepsStringIds = exercise.steps.map((_, idx) => generateStringId(exercise.id, 'step', idx));
    const warningStringId = exercise.warning ? generateStringId(exercise.id, 'warning') : undefined;

    console.log(`  // Exercise: ${exercise.id}`);
    console.log(`  titleStringId: '${titleStringId}',`);
    console.log(`  descriptionStringId: '${descriptionStringId}',`);
    console.log(`  stepsStringIds: [${stepsStringIds.map(id => `'${id}'`).join(', ')}],`);
    if (warningStringId) {
      console.log(`  warningStringId: '${warningStringId}',`);
    }
    console.log('');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Exercise Strings Seeder ===\n');
  
  try {
    // Extract strings from INITIAL_EXERCISES
    const strings = extractStrings();
    console.log(`Extracted ${strings.length} strings from ${INITIAL_EXERCISES.length} exercises\n`);

    // Create French translations
    const frenchTranslations = createFrenchTranslations(strings);

    // Connect to database
    console.log('Connecting to database...');
    await pool.connect();
    console.log('✓ Connected\n');

    // Insert strings
    await insertStrings(strings);

    // Insert French translations
    await insertTranslations(frenchTranslations);

    // Generate update instructions
    generateConstantsUpdate();

    console.log('=== Seeding Complete ===');
    console.log('\nNext steps:');
    console.log('1. Update constants.ts with the string IDs shown above');
    console.log('2. Run the migration: npm run server:migrate');
    console.log('3. Restart the server');
    console.log('4. Use the translation API to add translations for other languages\n');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
