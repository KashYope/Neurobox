import { useState, useEffect } from 'react';
import { useTranslation } from '../src/i18nContext';
import { Exercise } from '../types';
import { exerciseTranslationService } from '../services/exerciseTranslationService';

const LOCAL_ENGLISH_EXERCISES: Record<string, Pick<Exercise, 'title' | 'description' | 'steps'>> = {
  'resp-478': { title: '4-7-8 breathing', description: 'A paced breathing pattern some people use to slow down and prepare for sleep.', steps: ['Breathe in gently through your nose for 4 seconds.', 'If comfortable, pause for 7 seconds.', 'Breathe out through your mouth for 8 seconds.', 'Repeat up to four times without forcing.'] },
  'ice-dive': { title: 'Cool face compress', description: 'Brief cool sensation can offer a clear sensory reference during rising stress.', steps: ['Wrap a cool pack in cloth; never put ice directly on skin.', 'Sit somewhere safe and breathe normally.', 'Place it gently on your cheeks for a few seconds.', 'Remove it and continue only if comfortable.'] },
  'wall-push': { title: 'Wall push', description: 'A controlled push for mobilizing tension and noticing physical support.', steps: ['Stand facing a solid wall with one foot forward.', 'Place both palms flat and increase pressure gradually.', 'Keep breathing and stay below pain.', 'Release slowly and notice your feet.'] },
  'butterfly-hug': { title: 'Butterfly hug', description: 'Gentle alternating self-tapping that may support settling and a sense of safety.', steps: ['Cross your arms over your chest.', 'Rest each hand on the opposite shoulder or arm.', 'Tap left and right alternately and gently.', 'Slow down or stop whenever you choose.'] },
  'shaking': { title: 'Gentle voluntary shaking', description: 'Light intentional movement for exploring tension and gradually returning to stillness.', steps: ['Begin by gently shaking your hands.', 'Add your arms or softly bounce your heels.', 'Keep every movement voluntary and easy to stop.', 'Slow down and notice your support.'] },
  'physio-sigh': { title: 'Double-inhale sigh', description: 'A double inhale followed by a longer exhale that can briefly change the feeling of activation.', steps: ['Take a comfortable breath in through your nose.', 'Add one smaller inhale.', 'Exhale slowly through your mouth.', 'Repeat three times without forcing.'] },
  '54321': { title: '5-4-3-2-1 grounding', description: 'A sensory inventory for gently bringing attention to the present environment.', steps: ['Name 5 things you see.', 'Name 4 things you can touch.', 'Name 3 things you hear.', 'Name 2 things you smell and 1 thing you taste.'] },
  'voo-sound': { title: 'The “voo” sound', description: 'A long voiced exhale whose vibration some people find settling.', steps: ['Take a comfortable breath in.', 'Exhale with a low “voo” sound.', 'Keep the vibration and volume comfortable.', 'Pause, then repeat up to five times.'] },
  'psoas-release': { title: 'Constructive rest', description: 'A supported resting position for easing perceived tension around the lower back and hips.', steps: ['Lie on your back.', 'Bend your knees with feet on the floor, or rest calves on a chair.', 'Let the floor support your weight.', 'Change position whenever needed.'] },
  'brain-dump': { title: 'Brain dump', description: 'Putting thoughts on paper can free mental space and create distance from rumination.', steps: ['Take paper or a local notes app.', 'Write every task or thought without organizing.', 'Draw if words are not useful.', 'Choose one item to keep visible, or stop there.'] },
  'visual-countdown': { title: 'Visual countdown', description: 'A repeated point of attention that may help shift away from busy thoughts before sleep.', steps: ['Close your eyes only if comfortable.', 'Picture 100 being drawn.', 'Imagine it fading, then picture 99.', 'Return gently to the last number when distracted.'] },
  'self-hug': { title: 'Containing self-hug', description: 'A self-chosen pressure exercise for noticing the boundaries of your body.', steps: ['Cross your arms.', 'Place each hand on the opposite upper arm or shoulder.', 'Choose a comfortable pressure.', 'Release immediately if contact is unwelcome.'] },
  'pmr-jacobson': { title: 'Muscle tense and release', description: 'Briefly tense and release muscle groups to notice the contrast between effort and rest.', steps: ['Gently tense your hands for a few seconds, then release.', 'Lift your shoulders, then release.', 'Press your feet into the floor, then release.', 'Skip any painful or injured area.'] },
  'five-minute-launch': {
    title: 'The five-minute launch',
    description: 'Reduce a task to one tiny first step so that starting feels more accessible.',
    steps: ['Choose one task.', 'Write down the smallest visible action.', 'Start a five-minute timer.', 'When it ends, freely choose whether to continue or stop.']
  },
  'visual-task-strip': {
    title: 'Visual task strip',
    description: 'Turn a sequence into a few visible cards that are easy to follow.',
    steps: ['Write three to five steps.', 'Draw a box before each step.', 'Cover later steps if they are distracting.', 'Check one box at a time.']
  },
  'sensory-menu': {
    title: 'Personal sensory menu',
    description: 'Identify comfortable or neutral sensory options for different moments of the day.',
    steps: ['List comfortable sounds, lights, textures, and movements.', 'Group them as calming, alerting, or neutral.', 'Keep one easy option within reach.']
  },
  'communication-card': {
    title: 'Quick communication card',
    description: 'Prepare a short phrase to show or send when speaking takes too much energy.',
    steps: ['Choose a common need.', 'Write a direct and respectful sentence.', 'Add what could help right now.', 'Keep it on your phone or in your wallet.']
  },
  'reading-window': {
    title: 'Reading window',
    description: 'Reduce the amount of visible text to make following a line easier.',
    steps: ['Take an opaque sheet of paper.', 'Leave an opening the height of one line.', 'Move the window as you read.', 'Adjust its width and contrast for comfort.']
  },
  'voice-first-draft': {
    title: 'Voice-first draft',
    description: 'Begin a text through dictation and organize the ideas afterward.',
    steps: ['Open your device’s local voice typing.', 'Say the ideas without correcting them.', 'Review only after finishing.', 'Arrange the text into short paragraphs.']
  },
  'movement-preview': {
    title: 'Preview a movement',
    description: 'Break down a physical action before trying it at your own pace.',
    steps: ['Check the space and remove obstacles.', 'Name the first three steps.', 'Mime them slowly without weight.', 'Try the action and stop if it becomes uncomfortable.']
  },
  'launch-pad': {
    title: 'Routine launch pad',
    description: 'Gather the objects needed for a recurring routine in one visible place.',
    steps: ['Choose a frequent routine.', 'Collect the useful objects.', 'Put them in a basket or visible area.', 'Add a simple label.']
  },
  'number-anchor': {
    title: 'Concrete number anchor',
    description: 'Connect an abstract number with an object, drawing, or visible quantity.',
    steps: ['Choose the number or calculation.', 'Represent it with objects or dots.', 'Group the items visually.', 'Write the matching calculation afterward.']
  },
  'estimate-check': {
    title: 'Estimate, then check',
    description: 'Give an approximate answer first, then verify with a tool without pressure.',
    steps: ['Write an approximate range.', 'Use a calculator or table.', 'Compare without calling the estimate right or wrong.', 'Keep the reference that may help next time.']
  }
};

/**
 * Hook to translate exercises based on current language
 * Automatically fetches and applies translations when language changes
 */
export function useExerciseTranslation(exercises: Exercise[]): Exercise[] {
  const { i18n } = useTranslation();
  const [translatedExercises, setTranslatedExercises] = useState<Exercise[]>(exercises);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const currentLang = i18n.language;

    // Fetch and apply translations for the current language (including French if translations exist)
    const applyTranslations = async () => {
      setIsTranslating(true);
      try {
        const translations = await exerciseTranslationService.fetchTranslations(currentLang);
        const translated = exerciseTranslationService.translateExercises(exercises, translations).map(exercise => {
          const localEnglish = currentLang.startsWith('en') ? LOCAL_ENGLISH_EXERCISES[exercise.id] : undefined;
          return localEnglish ? { ...exercise, ...localEnglish } : exercise;
        });
        setTranslatedExercises(translated);
      } catch (error) {
        console.error('Failed to apply exercise translations:', error);
        // Fallback to original exercises
        setTranslatedExercises(exercises);
      } finally {
        setIsTranslating(false);
      }
    };

    applyTranslations();
  }, [i18n.language, exercises]);

  return translatedExercises;
}
