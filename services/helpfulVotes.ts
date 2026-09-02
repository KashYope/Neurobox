const INSTALLATION_KEY = 'neurosooth_installation_id_v1';
const VOTED_EXERCISES_KEY = 'neurosooth_helpful_exercises_v1';

let memoryInstallationId: string | null = null;
const memoryVotes = new Set<string>();

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const createHelpfulVoteEventId = (): string => generateUuid();

export const getInstallationId = (): string => {
  if (typeof localStorage === 'undefined') {
    memoryInstallationId ||= generateUuid();
    return memoryInstallationId;
  }

  const existing = localStorage.getItem(INSTALLATION_KEY);
  if (existing) return existing;
  const created = generateUuid();
  localStorage.setItem(INSTALLATION_KEY, created);
  return created;
};

const readVotes = (): Set<string> => {
  if (typeof localStorage === 'undefined') return new Set(memoryVotes);
  try {
    const stored = JSON.parse(localStorage.getItem(VOTED_EXERCISES_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored.filter(value => typeof value === 'string') : []);
  } catch {
    return new Set();
  }
};

export const hasThankedExercise = (exerciseId: string): boolean => readVotes().has(exerciseId);

export const markExerciseThanked = (exerciseId: string): void => {
  if (typeof localStorage === 'undefined') {
    memoryVotes.add(exerciseId);
    return;
  }
  const votes = readVotes();
  votes.add(exerciseId);
  localStorage.setItem(VOTED_EXERCISES_KEY, JSON.stringify([...votes]));
};

export const unmarkExerciseThanked = (exerciseId: string): void => {
  if (typeof localStorage === 'undefined') {
    memoryVotes.delete(exerciseId);
    return;
  }
  const votes = readVotes();
  votes.delete(exerciseId);
  localStorage.setItem(VOTED_EXERCISES_KEY, JSON.stringify([...votes]));
};
