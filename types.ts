export enum NeuroType {
  ADHD = 'TDAH',
  ASD = 'TSA (Autisme)',
  Trauma = 'Trauma/CPTSD',
  HighSensitivity = 'HPE/HPI',
  None = 'Neurotypique'
}

export enum Situation {
  Crisis = 'Crise / Panique',
  Rumination = 'Ruminations Mentales',
  Freeze = 'Figement / Dissociation',
  Stress = 'Stress / Anxiété',
  Anger = 'Colère / Meltdown',
  Sleep = 'Sommeil / Insomnie',
  Pain = 'Douleurs / Tensions',
  Focus = 'Concentration',
  Trauma = 'Trauma / Flashback'
}

export interface UserProfile {
  name: string;
  neurotypes: NeuroType[];
  sensitivities: string[];
  completedOnboarding: boolean;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Exercise {
  id: string;
  serverId?: string;
  title: string;
  description: string;
  situation: Situation[];
  neurotypes: NeuroType[]; // Who is this best for?
  duration: string;
  steps: string[];
  warning?: string; // Critical clinical warnings from PDFs
  imageUrl: string; // Placeholder for GIF
  tags: string[];
  thanksCount: number;
  isCommunitySubmitted?: boolean;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  moderationStatus?: ModerationStatus;
  moderationNotes?: string;
  moderatedAt?: string;
  moderatedBy?: string;
}

export interface ServerExercise extends Exercise {
  serverId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  user: UserProfile | null;
  exercises: Exercise[];
  view: 'onboarding' | 'dashboard' | 'detail' | 'add';
  selectedExerciseId: string | null;
  filterSituation: Situation | 'All';
}