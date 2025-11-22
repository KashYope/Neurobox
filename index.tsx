import './src/i18n';
import React, { useState, useEffect, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { useTranslation } from 'react-i18next';
import { Exercise, UserProfile, PartnerAccount, Situation } from './types';
import {
  getUser,
  getExercises,
  getRecommendedExercises,
  saveExercise,
  incrementThanks,
  moderateExercise
} from './services/dataService';
import { syncService, SyncStatus } from './services/syncService';
import { apiClient } from './services/apiClient';
import { Router } from './components/Router';

// Constants
const MODERATION_QUEUE_POLL_INTERVAL = 45000; // 45 seconds

// Register the service worker
if (typeof window !== 'undefined') {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error('Service worker registration failed', error);
    }
  });
}

const App: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>(() => getExercises());
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    getRecommendedExercises(getExercises(), null, 'All')
  );
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'detail' | 'add' | 'moderation' | 'partner' | 'admin'>('dashboard');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [situationFilter, setSituationFilter] = useState<Situation | 'All'>('All');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [partnerSession, setPartnerSession] = useState<PartnerAccount | null>(null);
  const [pendingAdminAction, setPendingAdminAction] = useState<'moderation' | null>(null);
  const [serverModerationData, setServerModerationData] = useState<{
    queue: Exercise[];
    reviewed: Exercise[];
  } | null>(null);
  const [moderationStatusMessage, setModerationStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    syncService.init();
    const unsubscribeCache = syncService.subscribe(setAllExercises);
    const unsubscribeStatus = syncService.subscribeStatus(setSyncStatus);

    return () => {
      unsubscribeCache();
      unsubscribeStatus();
      syncService.destroy();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkSession = async () => {
      try {
         const { user } = await apiClient.getMe();
         setPartnerSession({
            id: user.id,
            organization: user.organization,
            contactName: user.contactName,
            email: user.email,
            role: user.role,
            status: 'active',
            password: ''
         });
      } catch {
         setPartnerSession(null);
      }
    };

    const handleSessionEvent: EventListener = () => {
      checkSession();
    };

    checkSession();
    window.addEventListener('partner-session-change', handleSessionEvent);

    return () => {
      window.removeEventListener('partner-session-change', handleSessionEvent);
    };
  }, []);

  useEffect(() => {
    // Load initial data
    const loadedUser = getUser();
    if (loadedUser) {
      setUser(loadedUser);
    } else {
      setView('onboarding');
    }
  }, []);

  useEffect(() => {
    if (pendingAdminAction === 'moderation' && partnerSession) {
      setView('moderation');
      setPendingAdminAction(null);
    }
  }, [pendingAdminAction, partnerSession]);

  useEffect(() => {
    if (view === 'partner' && partnerSession?.role === 'admin') {
      setView('admin');
    }
  }, [view, partnerSession]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (view !== 'moderation') {
      setServerModerationData(null);
      setModerationStatusMessage(null);
      return;
    }

    let isCancelled = false;
    const loadQueue = async () => {
      try {
        const response = await apiClient.fetchModerationQueue();
        if (!isCancelled) {
          setServerModerationData({ queue: response.queue.map(e => ({...e})), reviewed: response.recent.map(e => ({...e})) });
          setModerationStatusMessage(t('moderation:status.synced'));
        }
      } catch (error) {
        if (isCancelled) return;
        const message =
          error instanceof Error && /auth/i.test(error.message)
            ? t('moderation:status.tokenRequired')
            : t('moderation:status.serverUnavailable');
        setModerationStatusMessage(message);
        setServerModerationData(null);
      }
    };

    loadQueue();
    const interval = window.setInterval(loadQueue, MODERATION_QUEUE_POLL_INTERVAL);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [view, t]);

  useEffect(() => {
    if (view !== 'dashboard') {
      setIsAdminMenuOpen(false);
    }
  }, [view]);

  useEffect(() => {
    if (!isAdminMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAdminMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminMenuOpen]);

  // Refresh recommendations when filters or user changes
  useEffect(() => {
    const recs = getRecommendedExercises(allExercises, user, situationFilter);
    setExercises(recs);
  }, [allExercises, user, situationFilter]);

  useEffect(() => {
    if (!selectedExercise) return;
    const fresh = allExercises.find(ex => ex.id === selectedExercise.id);
    if (fresh && fresh !== selectedExercise) {
      setSelectedExercise(fresh);
    }
  }, [allExercises, selectedExercise]);

  const handleOnboardingComplete = (newUser: UserProfile) => {
    setUser(newUser);
    setView('dashboard');
  };

  const handleExerciseClick = (ex: Exercise) => {
    setSelectedExercise(ex);
    setView('detail');
  };

  const handleAddExercise = (newEx: Exercise) => {
    saveExercise(newEx);
    setView('dashboard');
  };

  const handleThanks = (exId: string) => {
    incrementThanks(exId);
  };

  const handlePartnerAccess = () => {
    // If already logged in as admin, go to admin dashboard
    if (partnerSession?.role === 'admin') {
        setView('admin');
    } else {
        setView('partner');
    }
    setIsAdminMenuOpen(false);
  };

  const handleModerationAccess = () => {
    if (partnerSession) {
      setView('moderation');
    } else {
      setPendingAdminAction('moderation');
      setView('partner');
    }
    setIsAdminMenuOpen(false);
  };

  const handleContributionAccess = () => {
    setView('add');
    setIsAdminMenuOpen(false);
  };

  const handleModerationDecision = (exercise: Exercise, status: 'approved' | 'rejected', notes?: string) => {
    const moderator = user?.name || 'Équipe NeuroSooth';
    const targetId = exercise.serverId ?? exercise.id;
    moderateExercise(targetId, status, {
      moderator,
      notes,
      shouldDelete: status === 'rejected'
    });
  };

  const displayPendingCount = serverModerationData?.queue.length ?? allExercises.filter(ex => ex.isCommunitySubmitted && (ex.moderationStatus ?? 'approved') === 'pending').length;

  return (
    <Router
      view={view}
      user={user}
      partnerSession={partnerSession}
      allExercises={allExercises}
      exercises={exercises}
      selectedExercise={selectedExercise}
      syncStatus={syncStatus}
      isAdminMenuOpen={isAdminMenuOpen}
      situationFilter={situationFilter}
      serverModerationData={serverModerationData}
      moderationStatusMessage={moderationStatusMessage}
      handleOnboardingComplete={handleOnboardingComplete}
      handleExerciseClick={handleExerciseClick}
      handleAddExercise={handleAddExercise}
      handleThanks={handleThanks}
      handlePartnerAccess={handlePartnerAccess}
      handleModerationAccess={handleModerationAccess}
      handleContributionAccess={handleContributionAccess}
      setSituationFilter={setSituationFilter}
      setView={setView}
      setIsAdminMenuOpen={setIsAdminMenuOpen}
      handleModerationDecision={handleModerationDecision}
    />
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    }>
      <App />
    </Suspense>
  );
}
