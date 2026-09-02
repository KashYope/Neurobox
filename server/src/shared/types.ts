export enum NeuroType {
  ADHD = 'ADHD',
  ASD = 'ASD',
  Trauma = 'Trauma',
  HighSensitivity = 'HighSensitivity',
  None = 'None'
}

export enum SupportNeed {
  Focus = 'Focus',
  TaskInitiation = 'TaskInitiation',
  Organization = 'Organization',
  WorkingMemory = 'WorkingMemory',
  Movement = 'Movement',
  SensoryRegulation = 'SensoryRegulation',
  Recovery = 'Recovery',
  Predictability = 'Predictability',
  Communication = 'Communication',
  ReadingWriting = 'ReadingWriting',
  Sequencing = 'Sequencing',
  MotorPlanning = 'MotorPlanning',
  TaskSetup = 'TaskSetup',
  NumberSupport = 'NumberSupport',
  Confidence = 'Confidence'
}

export interface SupportNeedWeight {
  need: SupportNeed;
  weight: number;
}

export interface RecommendationProfile {
  version: 1;
  source: 'assessment' | 'manual';
  needs: SupportNeedWeight[];
  createdAt: string;
}

export enum Situation {
  Crisis = 'Crisis',
  Rumination = 'Rumination',
  Freeze = 'Freeze',
  Stress = 'Stress',
  Anger = 'Anger',
  Sleep = 'Sleep',
  Pain = 'Pain',
  Focus = 'Focus',
  Trauma = 'Trauma'
}

export interface UserProfile {
  name: string;
  neurotypes: NeuroType[];
  sensitivities: string[];
  completedOnboarding: boolean;
}

export interface PartnerAccount {
  id: string;
  organization: string;
  contactName: string;
  email: string;
  status: 'pending' | 'active' | 'rejected';
  role: 'partner' | 'admin';
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Exercise {
  id: string;
  serverId?: string;

  // Content fields (legacy - kept for backward compatibility)
  title: string;
  description: string;
  steps: string[];
  warning?: string; // Optional safety information

  // String ID fields for translation system (new)
  titleStringId?: string;        // e.g., 'exercise.resp_478.title'
  descriptionStringId?: string;  // e.g., 'exercise.resp_478.description'
  stepsStringIds?: string[];     // e.g., ['exercise.resp_478.step_1', 'exercise.resp_478.step_2', ...]
  warningStringId?: string;      // e.g., 'exercise.resp_478.warning'

  // Metadata
  situation: Situation[];
  neurotypes: NeuroType[]; // Who is this best for?
  duration: string;
  imageUrl?: string; // Legacy/custom media metadata; the NDee catalog renders its unified procedural artwork
  tags: string[];
  supportNeeds: SupportNeed[];
  thanksCount: number;
  isCommunitySubmitted?: boolean;
  isPartnerContent?: boolean;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  moderationStatus?: ModerationStatus;
  moderationNotes?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  deletedAt?: string;
}

export interface ServerExercise extends Exercise {
  serverId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThankExerciseResponse {
  exercise: ServerExercise;
  accepted: boolean;
}

export interface AppState {
  user: UserProfile | null;
  exercises: Exercise[];
  view: 'onboarding' | 'dashboard' | 'detail' | 'add' | 'moderation' | 'partner';
  selectedExerciseId: string | null;
  filterSituation: Situation | 'All';
}
