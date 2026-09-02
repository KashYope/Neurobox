import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from './i18nContext.js';
import { App as CapacitorApp } from '@capacitor/app';
import { AlertTriangle, Activity, ArrowLeft, BarChart3, Building2, Button, CheckCircle2, ClipboardList, Clock, Heart, Languages, LogOut, ShieldCheck, Users, UserPlus, XCircle, Zap } from '../components/ui/index.js';
import { Onboarding } from '../components/onboarding/Onboarding.js';
import { Dashboard } from '../features/dashboard/Dashboard.js';
import { PartnerPortal } from '../features/partners/PartnerPortal.js';
import { BatchTranslationPanel } from '../features/admin/BatchTranslationPanel.js';
import { Situation } from '../types.js';
import { getUser, getExercises, getRecommendedExercises, saveExercise, incrementThanks, moderateExercise } from '../services/dataService.js';
import { syncService } from '../services/syncService.js';
import { apiClient } from '../services/apiClient.js';
import { useExerciseTranslation } from '../hooks/useExerciseTranslation.js';
import { ExerciseIllustration } from '../components/exercises/ExerciseIllustration.js';
import { THANKS_VISIBILITY_THRESHOLD } from '../constants.js';
import { hasThankedExercise } from '../services/helpfulVotes.js';
// --- Components ---
const TagBadge = ({ text }) => (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2 mb-2", children: text }));
const ExerciseDetail = ({ exercise, onBack, onThanks }) => {
    const { t } = useTranslation(['common', 'exercise']);
    const [hasThanked, setHasThanked] = useState(() => hasThankedExercise(exercise.id));
    const [thanksError, setThanksError] = useState(null);
    useEffect(() => {
        setHasThanked(hasThankedExercise(exercise.id));
        setThanksError(null);
    }, [exercise.id]);
    const handleThanks = async () => {
        if (!hasThanked) {
            try {
                setThanksError(null);
                const accepted = await onThanks();
                if (accepted)
                    setHasThanked(true);
            }
            catch {
                setThanksError(t('exercise:detail.thanksError'));
            }
        }
    };
    return (_jsxs("div", { className: "animate-slide-in bg-white min-h-screen md:min-h-0 pb-20", children: [_jsxs("div", { className: "sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "!p-2", "aria-label": t('buttons.back'), children: _jsx(ArrowLeft, { className: "w-6 h-6" }) }), _jsx("h2", { className: "text-lg font-bold truncate", children: exercise.title })] }), _jsxs("div", { className: "max-w-3xl mx-auto p-4 md:p-8", children: [_jsxs("div", { className: "rounded-2xl overflow-hidden shadow-lg mb-8 aspect-video bg-gray-100 relative", children: [_jsx(ExerciseIllustration, { exercise: exercise, className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute bottom-4 left-4 flex gap-2", children: exercise.situation.map(s => (_jsx("span", { className: "bg-black/70 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm", children: t(`situations.${s}`) }, s))) })] }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-500", children: [_jsx(Zap, { className: "w-4 h-4 text-amber-500" }), _jsx("span", { children: exercise.duration })] }), exercise.thanksCount >= THANKS_VISIBILITY_THRESHOLD ? (_jsxs("div", { className: "flex items-center gap-1 text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-full", children: [_jsx(Heart, { className: "w-4 h-4 fill-rose-600" }), _jsx("span", { children: t('exercise:detail.peopleFoundHelpful', { count: exercise.thanksCount }) })] })) : (_jsx("span", { className: "text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full", children: t(exercise.isCommunitySubmitted || exercise.isPartnerContent ? 'badges.teamApproved' : 'badges.editorialPick') }))] }), _jsx("p", { className: "text-lg text-slate-700 leading-relaxed", children: exercise.description }), _jsx("p", { className: "mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600", role: "note", children: t('exercise:detail.safetyNote') })] }), exercise.warning && (_jsxs("div", { className: "bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-8 flex items-start gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-amber-800", children: exercise.warning })] })), _jsxs("div", { className: "space-y-6 mb-12", children: [_jsx("h3", { className: "text-xl font-bold text-slate-900 mb-4", children: t('exercise:detail.instructions') }), exercise.steps.map((step, idx) => (_jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm", children: idx + 1 }), _jsx("p", { className: "text-slate-700 mt-1", children: step })] }, idx)))] }), _jsxs("div", { className: "border-t border-gray-100 pt-8 text-center", children: [_jsx("p", { className: "text-slate-500 mb-4 text-sm", children: t('exercise:detail.wasItHelpful') }), _jsxs(Button, { size: "lg", variant: hasThanked ? "outline" : "primary", onClick: handleThanks, disabled: hasThanked, className: hasThanked ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-rose-600 hover:bg-rose-700 text-white", children: [_jsx(Heart, { className: `w-5 h-5 mr-2 ${hasThanked ? 'fill-rose-600' : ''}` }), hasThanked ? t('exercise:detail.thanksSent') : t('exercise:detail.sayThanks')] }), thanksError && _jsx("p", { className: "mt-3 text-sm text-rose-700", role: "alert", children: thanksError })] })] })] }));
};
const AddExerciseForm = ({ onCancel, onSubmit }) => {
    const { t } = useTranslation(['common', 'exercise']);
    const dialogRef = useRef(null);
    const onCancelRef = useRef(onCancel);
    const createInitialFormState = () => ({
        title: '',
        description: '',
        duration: '',
        steps: [''],
        situation: [],
        neurotypes: [],
        tags: [],
    });
    const [formData, setFormData] = useState(createInitialFormState());
    const [feedback, setFeedback] = useState(null);
    useEffect(() => {
        onCancelRef.current = onCancel;
    }, [onCancel]);
    useEffect(() => {
        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const dialog = dialogRef.current;
        const focusableSelector = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
        dialog?.querySelector(focusableSelector)?.focus();
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCancelRef.current();
                return;
            }
            if (event.key !== 'Tab' || !dialog)
                return;
            const focusable = Array.from(dialog.querySelectorAll(focusableSelector));
            if (focusable.length === 0)
                return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocused?.focus();
        };
    }, []);
    const handleStepChange = (idx, val) => {
        const newSteps = [...(formData.steps || [])];
        newSteps[idx] = val;
        setFormData({ ...formData, steps: newSteps });
    };
    const addStep = () => {
        setFormData({ ...formData, steps: [...(formData.steps || []), ''] });
    };
    const toggleSituation = (sit) => {
        const current = formData.situation || [];
        if (current.includes(sit)) {
            setFormData({ ...formData, situation: current.filter(s => s !== sit) });
        }
        else {
            setFormData({ ...formData, situation: [...current, sit] });
        }
    };
    const doSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            setFeedback({ type: 'error', message: t('exercise:creation.feedback.missingFields') });
            return;
        }
        const timestamp = new Date().toISOString();
        const newEx = {
            id: Date.now().toString(),
            title: formData.title,
            description: formData.description,
            situation: formData.situation?.length ? formData.situation : [Situation.Stress],
            neurotypes: formData.neurotypes || [],
            duration: formData.duration || '5 min',
            steps: formData.steps?.filter(s => s.trim() !== '') || [],
            tags: ['Community'],
            thanksCount: 0,
            isCommunitySubmitted: true,
            moderationStatus: 'pending',
            createdAt: timestamp,
            updatedAt: timestamp
        };
        try {
            const result = await onSubmit(newEx);
            setFeedback({
                type: 'success',
                message: t(result === 'queued' ? 'exercise:creation.feedback.savedOffline' : 'exercise:creation.feedback.success')
            });
            setFormData(createInitialFormState());
        }
        catch (error) {
            console.error('Failed to submit exercise', error);
            setFeedback({ type: 'error', message: t('exercise:creation.feedback.error') });
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-slate-50 z-50 overflow-y-auto motion-safe:animate-slide-in", children: _jsxs("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "contribution-dialog-title", className: "max-w-2xl mx-auto bg-white min-h-screen shadow-xl", children: [_jsxs("div", { className: "sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10", children: [_jsx("h2", { id: "contribution-dialog-title", className: "text-lg font-bold", children: t('exercise:creation.title') }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onCancel, children: t('exercise:creation.cancel') })] }), _jsxs("form", { onSubmit: doSubmit, className: "p-6 space-y-6", children: [_jsxs("div", { className: "bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex gap-3", children: [_jsx(Clock, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }), _jsx("p", { children: t('exercise:creation.communityNote') })] }), feedback && (_jsx("div", { role: feedback.type === 'error' ? 'alert' : 'status', "aria-live": feedback.type === 'error' ? 'assertive' : 'polite', className: `rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-rose-50 border-rose-200 text-rose-700'}`, children: feedback.message })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('exercise:creation.form.title') }), _jsx("input", { className: "w-full border p-2 rounded-lg", value: formData.title, onChange: e => setFormData({ ...formData, title: e.target.value }), placeholder: t('exercise:creation.form.titlePlaceholder'), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('exercise:creation.form.description') }), _jsx("textarea", { className: "w-full border p-2 rounded-lg", value: formData.description, onChange: e => setFormData({ ...formData, description: e.target.value }), placeholder: t('exercise:creation.form.descriptionPlaceholder'), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: t('exercise:creation.form.situation') }), _jsx("div", { className: "flex flex-wrap gap-2", children: Object.values(Situation).map(s => (_jsx("button", { type: "button", onClick: () => toggleSituation(s), className: `px-3 py-1 rounded-full text-xs border transition-colors ${formData.situation?.includes(s)
                                            ? 'bg-teal-600 text-white border-teal-600'
                                            : 'bg-white text-slate-600 border-slate-200'}`, children: t(`situations.${s}`) }, s))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('exercise:creation.form.duration') }), _jsx("input", { className: "w-full border p-2 rounded-lg", value: formData.duration, onChange: e => setFormData({ ...formData, duration: e.target.value }), placeholder: t('exercise:creation.form.durationPlaceholder') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: t('exercise:creation.form.steps') }), formData.steps?.map((step, i) => (_jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("span", { className: "pt-2 text-xs text-slate-400", children: i + 1 }), _jsx("input", { className: "w-full border p-2 rounded-lg", value: step, onChange: e => handleStepChange(i, e.target.value), placeholder: t('exercise:creation.form.stepPlaceholder', { number: i + 1 }) })] }, i))), _jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: addStep, className: "mt-2", children: t('exercise:creation.form.addStep') })] }), _jsx("div", { className: "pt-6", children: _jsx(Button, { type: "submit", className: "w-full", size: "lg", children: t('exercise:creation.form.submit') }) })] })] }) }));
};
// Partner contribution workflows live in features/partners/PartnerPortal.tsx.
const ModerationPanel = ({ pendingExercises, reviewedExercises, onApprove, onReject, onBack, statusNote }) => {
    const { t } = useTranslation(['common', 'moderation']);
    const [notesMap, setNotesMap] = useState({});
    const handleNoteChange = (id, value) => {
        setNotesMap(prev => ({ ...prev, [id]: value }));
    };
    const renderStatusBadge = (status) => {
        const base = 'px-2 py-0.5 rounded-full text-xs font-semibold';
        if (status === 'approved') {
            return _jsx("span", { className: `${base} bg-emerald-100 text-emerald-700`, children: t('moderation:status.approved') });
        }
        if (status === 'rejected') {
            return _jsx("span", { className: `${base} bg-rose-100 text-rose-700`, children: t('moderation:status.rejected') });
        }
        return _jsx("span", { className: `${base} bg-amber-100 text-amber-700`, children: t('moderation:status.pending') });
    };
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("header", { className: "bg-white border-b border-slate-100 sticky top-0 z-20", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 py-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ShieldCheck, { className: "w-8 h-8 text-teal-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-widest text-slate-500", children: t('moderation:header.space') }), _jsx("h1", { className: "text-xl font-bold text-slate-900", children: t('moderation:header.review') })] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: onBack, children: t('moderation:header.backToApp') })] }) }), _jsxs("main", { className: "max-w-5xl mx-auto px-4 py-8 space-y-10", children: [statusNote && (_jsx("div", { className: "bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl p-4", children: statusNote })), _jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(ClipboardList, { className: "w-5 h-5 text-slate-500" }), _jsx("h2", { className: "text-lg font-semibold text-slate-900", children: t('moderation:queue.title', { count: pendingExercises.length }) })] }), pendingExercises.length === 0 ? (_jsxs("div", { className: "bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6 flex items-center gap-3", children: [_jsx(CheckCircle2, { className: "w-6 h-6" }), _jsx("p", { children: t('moderation:queue.empty') })] })) : (_jsx("div", { className: "space-y-4", children: pendingExercises.map(ex => (_jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-slate-100 p-5", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-widest text-slate-400 mb-1", children: t('moderation:queue.proposedOn', { date: new Date(ex.createdAt || '').toLocaleString() }) }), _jsx("h3", { className: "text-xl font-semibold text-slate-900", children: ex.title }), _jsx("p", { className: "text-slate-600 mt-1", children: ex.description })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: ex.situation.map(sit => (_jsx(TagBadge, { text: t(`situations.${sit}`) }, sit))) })] }), _jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-slate-500 mb-1", children: t('moderation:queue.duration') }), _jsx("p", { className: "text-sm text-slate-700", children: ex.duration })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-slate-500 mb-1", children: t('moderation:queue.tags') }), _jsx("p", { className: "text-sm text-slate-700", children: ex.tags.join(', ') })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "text-xs font-semibold text-slate-500", children: t('moderation:queue.internalNote') }), _jsx("textarea", { className: "mt-1 w-full border border-slate-200 rounded-xl p-3 text-sm", placeholder: t('moderation:queue.internalNotePlaceholder'), value: notesMap[ex.id] || '', onChange: e => handleNoteChange(ex.id, e.target.value) })] }), _jsxs("div", { className: "mt-4 flex flex-col md:flex-row justify-end gap-3", children: [_jsxs(Button, { variant: "danger", onClick: () => onReject(ex, notesMap[ex.id]), children: [_jsx(XCircle, { className: "w-4 h-4 mr-2" }), t('moderation:queue.reject')] }), _jsxs(Button, { onClick: () => onApprove(ex, notesMap[ex.id]), children: [_jsx(CheckCircle2, { className: "w-4 h-4 mr-2" }), t('moderation:queue.approve')] })] })] }, ex.id))) }))] }), _jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Clock, { className: "w-5 h-5 text-slate-500" }), _jsx("h2", { className: "text-lg font-semibold text-slate-900", children: t('moderation:history.title') })] }), reviewedExercises.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: t('moderation:history.empty') })) : (_jsx("div", { className: "space-y-3", children: reviewedExercises.map(ex => (_jsxs("div", { className: "bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: ex.title }), _jsx("p", { className: "text-xs text-slate-500", children: t('moderation:history.moderatedBy', {
                                                        author: ex.moderatedBy || 'Admin',
                                                        date: ex.moderatedAt ? new Date(ex.moderatedAt).toLocaleString() : t('moderation:history.unknownDate')
                                                    }) }), ex.moderationNotes && (_jsx("p", { className: "text-sm text-slate-600 mt-1", children: t('moderation:history.note', { note: ex.moderationNotes }) }))] }), renderStatusBadge(ex.moderationStatus || 'pending')] }, ex.id))) }))] })] })] }));
};
const AdminDashboard = ({ onBack }) => {
    const { t } = useTranslation(['common', 'partner', 'moderation']);
    const [accounts, setAccounts] = useState([]);
    const [viewMode, setViewMode] = useState('accounts');
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
    const [accountsError, setAccountsError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [metricsError, setMetricsError] = useState(null);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
    const [metricsUpdatedAt, setMetricsUpdatedAt] = useState(null);
    const [adminFeedback, setAdminFeedback] = useState(null);
    // Dummy state for moderation panel props since we reuse it
    const [pendingExercises, setPendingExercises] = useState([]);
    const [reviewedExercises, setReviewedExercises] = useState([]);
    const [moderationStatus, setModerationStatus] = useState(null);
    const loadAccounts = useCallback(async () => {
        setIsLoadingAccounts(true);
        setAccountsError(null);
        try {
            const response = await apiClient.fetchPartners();
            const mapped = response.partners;
            setAccounts(mapped);
        }
        catch (error) {
            setAccountsError(error.message || t('adminDashboard.loadAccountsError'));
        }
        finally {
            setIsLoadingAccounts(false);
        }
    }, [t]);
    const loadMetrics = useCallback(async (force = false) => {
        if (!force && metricsUpdatedAt && Date.now() - metricsUpdatedAt < 60_000) {
            return;
        }
        setIsLoadingMetrics(true);
        setMetricsError(null);
        try {
            const response = await apiClient.fetchAdminMetrics();
            setMetrics(response);
            setMetricsUpdatedAt(Date.now());
        }
        catch (error) {
            setMetricsError(error.message || t('adminDashboard.loadMetricsError'));
        }
        finally {
            setIsLoadingMetrics(false);
        }
    }, [metricsUpdatedAt, t]);
    useEffect(() => {
        if (viewMode === 'accounts') {
            loadAccounts();
        }
    }, [viewMode, loadAccounts]);
    useEffect(() => {
        loadMetrics(true);
        const interval = setInterval(() => loadMetrics(true), 60000);
        return () => clearInterval(interval);
    }, [loadMetrics]);
    useEffect(() => {
        if (viewMode === 'moderation') {
            const loadQueue = async () => {
                try {
                    const response = await apiClient.fetchModerationQueue();
                    setPendingExercises(response.queue);
                    setReviewedExercises(response.recent);
                    setModerationStatus(t('moderation:status.synced'));
                }
                catch (error) {
                    // Fallback to local if server fails or auth fails (though admin should be auth'd)
                    setModerationStatus(t('moderation:status.serverUnavailable'));
                    const all = getExercises();
                    const community = all.filter(ex => ex.isCommunitySubmitted);
                    setPendingExercises(community.filter(ex => (ex.moderationStatus ?? 'approved') === 'pending'));
                    setReviewedExercises(community.filter(ex => (ex.moderationStatus && ex.moderationStatus !== 'pending') || ex.moderatedAt));
                }
            };
            loadQueue();
        }
    }, [viewMode, t]);
    const formatNumber = (value) => value.toLocaleString();
    const metricCards = metrics
        ? [
            {
                label: t('adminDashboard.totalFeedback'),
                value: metrics.totalThanks,
                subLabel: t('adminDashboard.approvedExercises', { count: formatNumber(metrics.approvedExercises) }),
                icon: Heart,
                iconColor: 'text-rose-500',
                iconBg: 'bg-rose-50'
            },
            {
                label: t('adminDashboard.exercisesInDb'),
                value: metrics.totalExercises,
                subLabel: t('adminDashboard.pendingModeration', { count: formatNumber(metrics.pendingModeration) }),
                icon: ClipboardList,
                iconColor: 'text-indigo-600',
                iconBg: 'bg-indigo-50'
            },
            {
                label: t('adminDashboard.users'),
                value: metrics.totalUsers,
                subLabel: t('adminDashboard.userSummary', {
                    active: formatNumber(metrics.activeUsers),
                    pending: formatNumber(metrics.pendingUsers)
                }),
                icon: Users,
                iconColor: 'text-slate-700',
                iconBg: 'bg-slate-50'
            },
            {
                label: t('adminDashboard.contentMix'),
                value: metrics.partnerExercises + metrics.communityExercises,
                subLabel: t('adminDashboard.contentSummary', {
                    partner: formatNumber(metrics.partnerExercises),
                    community: formatNumber(metrics.communityExercises)
                }),
                icon: BarChart3,
                iconColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50'
            }
        ]
        : [];
    const handleUpdateStatus = async (id, status) => {
        setActionInProgress(id);
        setAccountsError(null);
        setAdminFeedback(null);
        try {
            if (status === 'active') {
                await apiClient.approvePartner(id);
            }
            else {
                await apiClient.rejectPartner(id);
            }
            await loadAccounts();
            setAdminFeedback({
                type: 'success',
                message: status === 'active'
                    ? t('common:adminFeedback.approved')
                    : t('common:adminFeedback.rejected')
            });
        }
        catch (error) {
            setAccountsError(error.message || t('adminDashboard.updateAccountError'));
            setAdminFeedback({
                type: 'error',
                message: error.message || t('common:adminFeedback.updateError')
            });
        }
        finally {
            setActionInProgress(null);
        }
    };
    const handleLogout = async () => {
        await apiClient.logout();
        onBack();
    };
    const handleModerationDecision = (exercise, status, notes) => {
        const moderator = 'Admin';
        const targetId = exercise.serverId ?? exercise.id;
        moderateExercise(targetId, status, {
            moderator,
            notes,
            shouldDelete: status === 'rejected'
        });
        // Refresh local view
        setPendingExercises(prev => prev.filter(ex => ex.id !== exercise.id));
        setReviewedExercises(prev => [{
                ...exercise,
                moderationStatus: status,
                moderationNotes: notes,
                moderatedBy: moderator,
                moderatedAt: new Date().toISOString()
            }, ...prev]);
    };
    if (viewMode === 'batchTranslation') {
        return _jsx(BatchTranslationPanel, { onBack: () => {
                if (window.history.state?.view) {
                    window.history.back();
                }
                else {
                    setViewMode('accounts');
                }
            } });
    }
    if (viewMode === 'moderation') {
        return (_jsx(ModerationPanel, { pendingExercises: pendingExercises, reviewedExercises: reviewedExercises, onApprove: (ex, notes) => handleModerationDecision(ex, 'approved', notes), onReject: (ex, notes) => handleModerationDecision(ex, 'rejected', notes), onBack: () => {
                if (window.history.state?.view) {
                    window.history.back();
                }
                else {
                    setViewMode('accounts');
                }
            }, statusNote: moderationStatus }));
    }
    const pendingAccounts = accounts.filter(a => a.status === 'pending');
    const activeAccounts = accounts.filter(a => a.status === 'active');
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("header", { className: "bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ShieldCheck, { className: "w-8 h-8 text-teal-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-widest text-slate-400", children: "NeuroSooth" }), _jsx("h1", { className: "text-xl font-bold", children: t('adminDashboard.title') })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { variant: "secondary", size: "sm", onClick: () => setViewMode('batchTranslation'), children: [_jsx(Languages, { className: "w-4 h-4 mr-2" }), t('adminDashboard.batchTranslations')] }), _jsxs(Button, { variant: "secondary", size: "sm", onClick: () => setViewMode('moderation'), children: [_jsx(ClipboardList, { className: "w-4 h-4 mr-2" }), t('adminDashboard.moderationContent')] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleLogout, className: "border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800", children: [_jsx(LogOut, { className: "w-4 h-4 mr-2" }), t('buttons.logout')] })] })] }) }), _jsxs("main", { className: "max-w-6xl mx-auto px-4 py-8 space-y-8", children: [adminFeedback && (_jsx("div", { className: `rounded-xl border px-4 py-3 text-sm ${adminFeedback.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'}`, children: adminFeedback.message })), _jsxs("section", { className: "bg-white rounded-2xl shadow-sm p-6 border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Activity, { className: "w-6 h-6 text-emerald-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: t('adminDashboard.liveOverview') }), _jsx("h2", { className: "text-lg font-bold text-slate-900", children: t('adminDashboard.platformMetrics') })] })] }), _jsx("div", { className: "text-xs text-slate-500", children: metricsUpdatedAt
                                            ? t('adminDashboard.updatedAt', { time: new Date(metricsUpdatedAt).toLocaleTimeString() })
                                            : t('adminDashboard.awaitingSync') })] }), metricsError && (_jsx("div", { className: "mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800", children: metricsError })), isLoadingMetrics && !metrics ? (_jsx("p", { className: "text-slate-500 italic", children: t('adminDashboard.loadingMetrics') })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: metricCards.map(card => (_jsxs("div", { className: "p-4 border border-slate-100 rounded-xl bg-slate-50/60 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: card.label }), _jsx("p", { className: "text-2xl font-bold text-slate-900", children: formatNumber(card.value) }), card.subLabel && _jsx("p", { className: "text-xs text-slate-500", children: card.subLabel })] }), _jsx("div", { className: `p-3 rounded-lg ${card.iconBg}`, children: _jsx(card.icon, { className: `w-6 h-6 ${card.iconColor}` }) })] }, card.label))) }))] }), _jsxs("section", { className: "bg-white rounded-2xl shadow-sm p-6 border border-slate-200", children: [_jsx("div", { className: "flex items-center justify-between mb-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(UserPlus, { className: "w-6 h-6 text-amber-500" }), _jsx("h2", { className: "text-lg font-bold text-slate-900", children: t('adminDashboard.pendingRegistrations', { count: pendingAccounts.length }) })] }) }), accountsError && (_jsx("div", { className: "mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700", children: accountsError })), isLoadingAccounts ? (_jsx("p", { className: "text-slate-500 italic", children: t('adminDashboard.loadingAccounts') })) : pendingAccounts.length === 0 ? (_jsx("p", { className: "text-slate-500 italic", children: t('adminDashboard.noPendingAccounts') })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm text-slate-600", children: [_jsx("thead", { className: "bg-slate-50 text-xs uppercase font-semibold text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 rounded-l-lg", children: t('labels.organization') }), _jsx("th", { className: "px-4 py-3", children: t('adminDashboard.contact') }), _jsx("th", { className: "px-4 py-3", children: t('labels.email') }), _jsx("th", { className: "px-4 py-3 rounded-r-lg text-right", children: t('adminDashboard.actions') })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: pendingAccounts.map(acc => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-900", children: acc.organization }), _jsx("td", { className: "px-4 py-3", children: acc.contactName }), _jsx("td", { className: "px-4 py-3", children: acc.email }), _jsxs("td", { className: "px-4 py-3 text-right flex justify-end gap-2", children: [_jsx(Button, { size: "sm", variant: "ghost", className: "text-rose-600 hover:bg-rose-50", onClick: () => handleUpdateStatus(acc.id, 'rejected'), disabled: actionInProgress === acc.id, children: actionInProgress === acc.id ? t('adminDashboard.processing') : t('buttons.reject') }), _jsx(Button, { size: "sm", onClick: () => handleUpdateStatus(acc.id, 'active'), disabled: actionInProgress === acc.id, children: actionInProgress === acc.id ? t('adminDashboard.saving') : t('buttons.approve') })] })] }, acc.id))) })] }) }))] }), _jsxs("section", { className: "bg-white rounded-2xl shadow-sm p-6 border border-slate-200", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx(Building2, { className: "w-6 h-6 text-teal-600" }), _jsx("h2", { className: "text-lg font-bold text-slate-900", children: t('adminDashboard.activePartners', { count: activeAccounts.length }) })] }), isLoadingAccounts ? (_jsx("p", { className: "text-slate-500 italic", children: t('adminDashboard.loadingAccounts') })) : activeAccounts.length === 0 ? (_jsx("p", { className: "text-slate-500 italic", children: t('adminDashboard.noActivePartners') })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: activeAccounts.map(acc => (_jsxs("div", { className: "p-4 border border-slate-100 rounded-xl hover:border-teal-200 transition-colors", children: [_jsx("h3", { className: "font-semibold text-slate-900", children: acc.organization }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: acc.contactName }), _jsx("p", { className: "text-xs text-slate-400", children: acc.email }), acc.role === 'admin' && _jsx("span", { className: "inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded", children: "Admin" })] }, acc.id))) }))] })] })] }));
};
const isAppView = (value) => ['onboarding', 'dashboard', 'detail', 'add', 'moderation', 'partner', 'admin'].includes(String(value));
const App = () => {
    const { t } = useTranslation(['common']);
    const [user, setUser] = useState(null);
    const [allExercises, setAllExercises] = useState(() => getExercises());
    // Apply translations to exercises based on current language
    const translatedExercises = useExerciseTranslation(allExercises);
    const [exercises, setExercises] = useState(() => getRecommendedExercises(getExercises(), null, 'All'));
    const [view, setView] = useState('dashboard');
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [situationFilter, setSituationFilter] = useState('All');
    const [syncStatus, setSyncStatus] = useState(syncService.getStatus());
    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
    const [partnerSession, setPartnerSession] = useState(null);
    const [pendingAdminAction, setPendingAdminAction] = useState(null);
    const [serverModerationData, setServerModerationData] = useState(null);
    const [moderationStatusMessage, setModerationStatusMessage] = useState(null);
    const applyNavigationState = useCallback((state) => {
        if (state.view === 'detail') {
            const exercise = translatedExercises.find(item => item.id === state.exerciseId);
            if (!exercise) {
                setSelectedExercise(null);
                setView('dashboard');
                return;
            }
            setSelectedExercise(exercise);
        }
        else {
            setSelectedExercise(null);
        }
        setView(state.view);
    }, [translatedExercises]);
    const navigateTo = useCallback((newView, exerciseId) => {
        const state = { view: newView, ...(exerciseId ? { exerciseId } : {}) };
        window.history.pushState(state, '', window.location.pathname);
        applyNavigationState(state);
    }, [applyNavigationState]);
    const replaceView = useCallback((newView, exerciseId) => {
        const state = { view: newView, ...(exerciseId ? { exerciseId } : {}) };
        window.history.replaceState(state, '', window.location.pathname);
        applyNavigationState(state);
    }, [applyNavigationState]);
    useEffect(() => {
        syncService.init();
        const unsubscribeCache = syncService.subscribe(setAllExercises);
        const unsubscribeStatus = syncService.subscribeStatus(setSyncStatus);
        return () => {
            unsubscribeCache();
            unsubscribeStatus();
        };
    }, []);
    // Handle browser back button and native back gesture
    useEffect(() => {
        const handlePopState = (event) => {
            const state = event.state;
            applyNavigationState({
                view: isAppView(state?.view) ? state.view : 'dashboard',
                exerciseId: typeof state?.exerciseId === 'string' ? state.exerciseId : undefined
            });
        };
        window.addEventListener('popstate', handlePopState);
        // Handle native back button for Capacitor (Android/iOS)
        let removeBackButtonListener;
        void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (view === 'dashboard' || view === 'onboarding') {
                // Allow app to exit on dashboard or onboarding
                if (canGoBack) {
                    window.history.back();
                }
                else {
                    CapacitorApp.exitApp();
                }
            }
            else {
                window.history.back();
            }
        }).then(listener => {
            removeBackButtonListener = () => listener.remove();
        });
        return () => {
            window.removeEventListener('popstate', handlePopState);
            void removeBackButtonListener?.();
        };
    }, [applyNavigationState, view]);
    // Push initial history state
    useEffect(() => {
        const state = window.history.state;
        if (!isAppView(state?.view))
            window.history.replaceState({ view: 'dashboard' }, '', window.location.pathname);
    }, []);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const checkSession = async () => {
            try {
                const { user } = await apiClient.getMe();
                setPartnerSession({
                    id: user.id,
                    organization: user.organization,
                    contactName: user.contactName,
                    email: user.email,
                    role: user.role,
                    status: 'active'
                });
            }
            catch {
                setPartnerSession(null);
            }
        };
        const handleSessionEvent = () => {
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
        }
        else {
            replaceView('onboarding');
        }
    }, [replaceView]);
    useEffect(() => {
        if (pendingAdminAction === 'moderation' && partnerSession) {
            replaceView('moderation');
            setPendingAdminAction(null);
        }
    }, [pendingAdminAction, partnerSession, replaceView]);
    useEffect(() => {
        if (view === 'partner' && partnerSession?.role === 'admin') {
            replaceView('admin');
        }
    }, [view, partnerSession, replaceView]);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
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
                    setServerModerationData({ queue: response.queue, reviewed: response.recent });
                    setModerationStatusMessage(t('moderation:status.synced'));
                }
            }
            catch (error) {
                if (isCancelled)
                    return;
                const message = error instanceof Error && /auth/i.test(error.message)
                    ? t('moderation:status.tokenRequired')
                    : t('moderation:status.serverUnavailable');
                setModerationStatusMessage(message);
                setServerModerationData(null);
            }
        };
        loadQueue();
        const interval = window.setInterval(loadQueue, 45000);
        return () => {
            isCancelled = true;
            clearInterval(interval);
        };
    }, [view]);
    useEffect(() => {
        if (view !== 'dashboard') {
            setIsAdminMenuOpen(false);
        }
    }, [view]);
    useEffect(() => {
        if (!isAdminMenuOpen)
            return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsAdminMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAdminMenuOpen]);
    // Refresh recommendations when filters or user changes
    useEffect(() => {
        const recs = getRecommendedExercises(translatedExercises, user, situationFilter);
        setExercises(recs);
    }, [translatedExercises, user, situationFilter]);
    useEffect(() => {
        if (!selectedExercise)
            return;
        const fresh = translatedExercises.find(ex => ex.id === selectedExercise.id);
        if (fresh && fresh !== selectedExercise) {
            setSelectedExercise(fresh);
        }
    }, [translatedExercises, selectedExercise]);
    const handleOnboardingComplete = (newUser) => {
        setUser(newUser);
        replaceView('dashboard');
    };
    const handleExerciseClick = (ex) => {
        setSelectedExercise(ex);
        navigateTo('detail', ex.id);
    };
    const handleAddExercise = async (newEx) => {
        await saveExercise(newEx);
        return syncService.getStatus().pendingMutations === 0 ? 'submitted' : 'queued';
    };
    const handleThanks = (exId) => incrementThanks(exId);
    const handlePartnerAccess = () => {
        // If already logged in as admin, go to admin dashboard
        if (partnerSession?.role === 'admin') {
            navigateTo('admin');
        }
        else {
            navigateTo('partner');
        }
        setIsAdminMenuOpen(false);
    };
    const handleModerationAccess = () => {
        if (partnerSession) {
            navigateTo('moderation');
        }
        else {
            setPendingAdminAction('moderation');
            navigateTo('partner');
        }
        setIsAdminMenuOpen(false);
    };
    const handleContributionAccess = () => {
        navigateTo('add');
        setIsAdminMenuOpen(false);
    };
    const showSyncStatus = !syncStatus.isOnline || syncStatus.pendingMutations > 0 || syncStatus.isSyncing || Boolean(syncStatus.lastError);
    const communityExercises = translatedExercises.filter(ex => ex.isCommunitySubmitted);
    const parseTimestamp = (value) => (value ? Date.parse(value) : 0);
    const localPendingExercises = communityExercises.filter(ex => (ex.moderationStatus ?? 'approved') === 'pending');
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
    const displayPendingCount = effectivePendingExercises.length;
    const handleModerationDecision = (exercise, status, notes) => {
        const moderator = user?.name || 'Équipe NeuroSooth';
        const targetId = exercise.serverId ?? exercise.id;
        moderateExercise(targetId, status, {
            moderator,
            notes,
            shouldDelete: status === 'rejected'
        });
    };
    // Render Helpers
    if (view === 'admin') {
        return _jsx(AdminDashboard, { onBack: () => {
                window.history.back();
            } });
    }
    if (view === 'partner') {
        return _jsx(PartnerPortal, { onBack: () => {
                window.history.back();
            } });
    }
    if (view === 'moderation') {
        return (_jsx(ModerationPanel, { pendingExercises: effectivePendingExercises, reviewedExercises: effectiveReviewedExercises, onApprove: (exercise, notes) => handleModerationDecision(exercise, 'approved', notes), onReject: (exercise, notes) => handleModerationDecision(exercise, 'rejected', notes), onBack: () => {
                window.history.back();
            }, statusNote: moderationStatusMessage }));
    }
    if (view === 'onboarding') {
        return _jsx(Onboarding, { onComplete: handleOnboardingComplete });
    }
    if (view === 'detail' && selectedExercise) {
        return (_jsx(ExerciseDetail, { exercise: selectedExercise, onBack: () => {
                window.history.back();
            }, onThanks: () => handleThanks(selectedExercise.id) }));
    }
    if (view === 'add') {
        return (_jsx(AddExerciseForm, { onCancel: () => {
                window.history.back();
            }, onSubmit: handleAddExercise }));
    }
    // Dashboard View
    return (_jsx(Dashboard, { user: user, exercises: exercises, situationFilter: situationFilter, onFilterChange: setSituationFilter, onExerciseClick: handleExerciseClick, onAddTechnique: handleContributionAccess, onPartnerAccess: handlePartnerAccess, syncStatus: syncStatus, showSyncStatus: showSyncStatus, partnerSession: partnerSession, isAdminMenuOpen: isAdminMenuOpen, onOpenAdminMenu: () => setIsAdminMenuOpen(true), onCloseAdminMenu: () => setIsAdminMenuOpen(false) }));
};
export default App;
