import React from 'react';
import { Exercise, UserProfile, PartnerAccount } from '../types';
import { Onboarding } from './Onboarding';
import { ExerciseDetail } from './ExerciseDetail';
import { AddExerciseForm } from './AddExerciseForm';
import { ModerationPanel } from './ModerationPanel';
import { PartnerPortal } from './PartnerPortal';
import { AdminDashboard } from './AdminDashboard';
import { Dashboard } from './Dashboard';

interface RouterProps {
  view: string;
  user: UserProfile | null;
  partnerSession: PartnerAccount | null;
  allExercises: Exercise[];
  exercises: Exercise[];
  selectedExercise: Exercise | null;
  syncStatus: any;
  isAdminMenuOpen: boolean;
  situationFilter: any;
  serverModerationData: any;
  moderationStatusMessage: string | null;
  handleOnboardingComplete: (user: UserProfile) => void;
  handleExerciseClick: (ex: Exercise) => void;
  handleAddExercise: (newEx: Exercise) => void;
  handleThanks: (exId: string) => void;
  handlePartnerAccess: () => void;
  handleModerationAccess: () => void;
  handleContributionAccess: () => void;
  setSituationFilter: (filter: any) => void;
  setView: (view: string) => void;
  setIsAdminMenuOpen: (isOpen: boolean) => void;
  handleModerationDecision: (exercise: Exercise, status: 'approved' | 'rejected', notes?: string) => void;
}

export const Router: React.FC<RouterProps> = ({
  view,
  user,
  partnerSession,
  allExercises,
  exercises,
  selectedExercise,
  syncStatus,
  isAdminMenuOpen,
  situationFilter,
  serverModerationData,
  moderationStatusMessage,
  handleOnboardingComplete,
  handleExerciseClick,
  handleAddExercise,
  handleThanks,
  handlePartnerAccess,
  handleModerationAccess,
  handleContributionAccess,
  setSituationFilter,
  setView,
  setIsAdminMenuOpen,
  handleModerationDecision,
}) => {
  if (view === 'admin') {
    return <AdminDashboard onBack={() => setView('dashboard')} />;
  }

  if (view === 'partner') {
    return <PartnerPortal onBack={() => setView('dashboard')} />;
  }

  if (view === 'moderation') {
    const communityExercises = allExercises.filter(ex => ex.isCommunitySubmitted);
    const parseTimestamp = (value?: string) => (value ? Date.parse(value) : 0);
    const localPendingExercises = communityExercises.filter(
      ex => (ex.moderationStatus ?? 'approved') === 'pending'
    );
    const localReviewedExercises = communityExercises
      .filter(ex => (ex.moderationStatus && ex.moderationStatus !== 'pending') || ex.moderatedAt)
      .sort((a, b) => {
        const dateA = parseTimestamp(a.moderatedAt) || parseTimestamp(a.createdAt);
        const dateB = parseTimestamp(b.moderatedAt) || parseTimestamp(b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 8);
    const effectivePendingExercises = serverModerationData?.queue ?? localPendingExercises;
    const effectiveReviewedExercises = serverModerationData?.reviewed ?? localReviewedExercises;

    return (
      <ModerationPanel
        pendingExercises={effectivePendingExercises}
        reviewedExercises={effectiveReviewedExercises}
        onApprove={(exercise, notes) => handleModerationDecision(exercise, 'approved', notes)}
        onReject={(exercise, notes) => handleModerationDecision(exercise, 'rejected', notes)}
        onBack={() => setView('dashboard')}
        statusNote={moderationStatusMessage}
      />
    );
  }

  if (view === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (view === 'detail' && selectedExercise) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        onBack={() => setView('dashboard')}
        onThanks={() => handleThanks(selectedExercise.id)}
      />
    );
  }

  if (view === 'add') {
    return (
      <AddExerciseForm
        onCancel={() => setView('dashboard')}
        onSubmit={handleAddExercise}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      exercises={exercises}
      syncStatus={syncStatus}
      isAdminMenuOpen={isAdminMenuOpen}
      situationFilter={situationFilter}
      handleExerciseClick={handleExerciseClick}
      handlePartnerAccess={handlePartnerAccess}
      handleModerationAccess={handleModerationAccess}
      handleContributionAccess={handleContributionAccess}
      setSituationFilter={setSituationFilter}
      setIsAdminMenuOpen={setIsAdminMenuOpen}
      setView={setView}
    />
  );
};
