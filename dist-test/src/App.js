import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from './i18nContext';
import { App as CapacitorApp } from '@capacitor/app';
import { AlertTriangle, Activity, ArrowLeft, BarChart3, Building2, Button, CheckCircle2, ClipboardList, Clock, FileSpreadsheet, Heart, Image as ImageIcon, Languages, Lock, LogOut, ShieldCheck, UploadCloud, User, Users, UserPlus, XCircle, Zap } from '../components/ui';
import { Onboarding } from '../components/onboarding/Onboarding';
import { Dashboard } from '../features/dashboard/Dashboard';
import { PartnerPortal } from '../features/partners/PartnerPortal';
import { BatchTranslationPanel } from '../features/admin/BatchTranslationPanel';
import { NeuroType, Situation } from '../types';
import { getUser, getExercises, getRecommendedExercises, saveExercise, incrementThanks, moderateExercise } from '../services/dataService';
import { syncService } from '../services/syncService';
import { apiClient } from '../services/apiClient';
import { useExerciseTranslation } from '../hooks/useExerciseTranslation';
// --- Components ---
const TagBadge = ({ text }) => (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2 mb-2", children: text }));
const ExerciseDetail = ({ exercise, onBack, onThanks }) => {
    const { t } = useTranslation(['common', 'exercise']);
    const [hasThanked, setHasThanked] = useState(false);
    const handleThanks = () => {
        if (!hasThanked) {
            onThanks();
            setHasThanked(true);
        }
    };
    return (_jsxs("div", { className: "animate-slide-in bg-white min-h-screen md:min-h-0 pb-20", children: [_jsxs("div", { className: "sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "!p-2", children: _jsx(ArrowLeft, { className: "w-6 h-6" }) }), _jsx("h2", { className: "text-lg font-bold truncate", children: exercise.title })] }), _jsxs("div", { className: "max-w-3xl mx-auto p-4 md:p-8", children: [_jsxs("div", { className: "rounded-2xl overflow-hidden shadow-lg mb-8 aspect-video bg-gray-100 relative", children: [_jsx("img", { src: exercise.imageUrl, alt: exercise.title, className: "w-full h-full object-cover", onError: (e) => { e.target.src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=NeuroSooth'; } }), _jsx("div", { className: "absolute bottom-4 left-4 flex gap-2", children: exercise.situation.map(s => (_jsx("span", { className: "bg-black/70 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm", children: t(`situations.${s}`) }, s))) })] }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-500", children: [_jsx(Zap, { className: "w-4 h-4 text-amber-500" }), _jsx("span", { children: exercise.duration })] }), _jsxs("div", { className: "flex items-center gap-1 text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-full", children: [_jsx(Heart, { className: "w-4 h-4 fill-rose-600" }), _jsx("span", { children: t('exercise:detail.peopleHelped', { count: exercise.thanksCount }) })] })] }), _jsx("p", { className: "text-lg text-slate-700 leading-relaxed", children: exercise.description })] }), exercise.warning && (_jsxs("div", { className: "bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-8 flex items-start gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-amber-800", children: exercise.warning })] })), _jsxs("div", { className: "space-y-6 mb-12", children: [_jsx("h3", { className: "text-xl font-bold text-slate-900 mb-4", children: t('exercise:detail.instructions') }), exercise.steps.map((step, idx) => (_jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm", children: idx + 1 }), _jsx("p", { className: "text-slate-700 mt-1", children: step })] }, idx)))] }), _jsxs("div", { className: "border-t border-gray-100 pt-8 text-center", children: [_jsx("p", { className: "text-slate-500 mb-4 text-sm", children: t('exercise:detail.wasItHelpful') }), _jsxs(Button, { size: "lg", variant: hasThanked ? "outline" : "primary", onClick: handleThanks, disabled: hasThanked, className: hasThanked ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-rose-600 hover:bg-rose-700 text-white", children: [_jsx(Heart, { className: `w-5 h-5 mr-2 ${hasThanked ? 'fill-rose-600' : ''}` }), hasThanked ? t('exercise:detail.thanksSent') : t('exercise:detail.sayThanks')] })] })] })] }));
};
const AddExerciseForm = ({ onCancel, onSubmit }) => {
    const { t } = useTranslation(['common', 'exercise']);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: '',
        steps: [''],
        situation: [],
        neurotypes: [],
        tags: [],
        imageUrl: ''
    });
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
    const doSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description)
            return;
        const timestamp = new Date().toISOString();
        const newEx = {
            id: Date.now().toString(),
            title: formData.title,
            description: formData.description,
            situation: formData.situation?.length ? formData.situation : [Situation.Stress],
            neurotypes: formData.neurotypes || [],
            duration: formData.duration || '5 min',
            steps: formData.steps?.filter(s => s.trim() !== '') || [],
            imageUrl: formData.imageUrl || 'https://placehold.co/600x400/94a3b8/ffffff?text=Community+Content',
            tags: ['Community'],
            thanksCount: 0,
            isCommunitySubmitted: true,
            moderationStatus: 'pending',
            createdAt: timestamp,
            updatedAt: timestamp
        };
        onSubmit(newEx);
    };
    return (_jsx("div", { className: "fixed inset-0 bg-slate-50 z-50 overflow-y-auto animate-slide-in", children: _jsxs("div", { className: "max-w-2xl mx-auto bg-white min-h-screen shadow-xl", children: [_jsxs("div", { className: "sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10", children: [_jsx("h2", { className: "text-lg font-bold", children: t('exercise:creation.title') }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onCancel, children: t('exercise:creation.cancel') })] }), _jsxs("form", { onSubmit: doSubmit, className: "p-6 space-y-6", children: [_jsxs("div", { className: "bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex gap-3", children: [_jsx(Clock, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }), _jsx("p", { children: t('exercise:creation.communityNote') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('exercise:creation.form.title') }), _jsx("input", { className: "w-full border p-2 rounded-lg", value: formData.title, onChange: e => setFormData({ ...formData, title: e.target.value }), placeholder: t('exercise:creation.form.titlePlaceholder'), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('exercise:creation.form.description') }), _jsx("textarea", { className: "w-full border p-2 rounded-lg", value: formData.description, onChange: e => setFormData({ ...formData, description: e.target.value }), placeholder: t('exercise:creation.form.descriptionPlaceholder'), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('exercise:creation.form.image') }), _jsx("div", { className: "flex gap-2", children: _jsxs("div", { className: "relative flex-1", children: [_jsx(ImageIcon, { className: "absolute left-3 top-2.5 w-5 h-5 text-gray-400" }), _jsx("input", { className: "w-full border p-2 pl-10 rounded-lg", value: formData.imageUrl, onChange: e => setFormData({ ...formData, imageUrl: e.target.value }), placeholder: "https://..." })] }) }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: t('exercise:creation.form.imageHelper') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: t('exercise:creation.form.situation') }), _jsx("div", { className: "flex flex-wrap gap-2", children: Object.values(Situation).map(s => (_jsx("button", { type: "button", onClick: () => toggleSituation(s), className: `px-3 py-1 rounded-full text-xs border transition-colors ${formData.situation?.includes(s)
                                            ? 'bg-teal-600 text-white border-teal-600'
                                            : 'bg-white text-slate-600 border-slate-200'}`, children: t(`situations.${s}`) }, s))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('exercise:creation.form.duration') }), _jsx("input", { className: "w-full border p-2 rounded-lg", value: formData.duration, onChange: e => setFormData({ ...formData, duration: e.target.value }), placeholder: t('exercise:creation.form.durationPlaceholder') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: t('exercise:creation.form.steps') }), formData.steps?.map((step, i) => (_jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("span", { className: "pt-2 text-xs text-slate-400", children: i + 1 }), _jsx("input", { className: "w-full border p-2 rounded-lg", value: step, onChange: e => handleStepChange(i, e.target.value), placeholder: t('exercise:creation.form.stepPlaceholder', { number: i + 1 }) })] }, i))), _jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: addStep, className: "mt-2", children: t('exercise:creation.form.addStep') })] }), _jsx("div", { className: "pt-6", children: _jsx(Button, { type: "submit", className: "w-full", size: "lg", children: t('exercise:creation.form.submit') }) })] })] }) }));
};
const splitToList = (value, pattern = /[,;|]/) => {
    if (Array.isArray(value)) {
        return value.map(item => `${item}`.trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(pattern)
            .map(item => item.trim())
            .filter(Boolean);
    }
    if (value === undefined || value === null)
        return [];
    const asString = `${value}`.trim();
    return asString ? [asString] : [];
};
const splitStepsInput = (value) => {
    return splitToList(value, /\r?\n|\|/);
};
const mapStringsToSituations = (values) => {
    const lowerValues = values.map(value => value.toLowerCase());
    const matches = lowerValues
        .map(value => Object.values(Situation).find(option => option.toLowerCase() === value || option.toLowerCase().includes(value)))
        .filter((value) => Boolean(value));
    return matches;
};
const mapStringsToNeurotypes = (values) => {
    const lowerValues = values.map(value => value.toLowerCase());
    const matches = lowerValues
        .map(value => Object.values(NeuroType).find(option => option.toLowerCase() === value || option.toLowerCase().includes(value)))
        .filter((value) => Boolean(value));
    return matches;
};
const createPartnerExercise = (draft, author) => {
    const timestamp = new Date().toISOString();
    const steps = (draft.steps || []).map(step => step.trim()).filter(Boolean);
    const tags = (draft.tags || []).map(tag => tag.trim()).filter(Boolean);
    const situation = draft.situation && draft.situation.length > 0 ? draft.situation : [Situation.Stress];
    return {
        id: `partner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: draft.title,
        description: draft.description,
        duration: draft.duration && draft.duration.trim() ? draft.duration : '5 min',
        steps: steps.length ? steps : ['Respiration consciente pendant 60 secondes'],
        tags: tags.length ? tags : ['Partenaire'],
        situation,
        neurotypes: draft.neurotypes || [],
        warning: draft.warning,
        imageUrl: draft.imageUrl && draft.imageUrl.trim()
            ? draft.imageUrl
            : 'https://placehold.co/600x400/0f172a/ffffff?text=Espace+Partenaire',
        thanksCount: 0,
        author,
        isPartnerContent: true,
        moderationStatus: 'approved',
        createdAt: timestamp,
        updatedAt: timestamp
    };
};
const parseCsvLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
};
const mapRowToDraft = (row) => {
    const title = row['title'] || row['nom'] || '';
    const description = row['description'] || row['desc'] || row['details'] || '';
    const duration = row['duration'] || row['duree'];
    const steps = splitStepsInput(row['steps'] || row['etapes']);
    const tags = splitToList(row['tags'] || row['motscles']);
    const situationStrings = splitToList(row['situations'] || row['situation']);
    const neuroStrings = splitToList(row['neurotypes']);
    return {
        title: title.trim(),
        description: description.trim(),
        duration: duration?.trim(),
        steps,
        tags,
        situation: mapStringsToSituations(situationStrings),
        neurotypes: mapStringsToNeurotypes(neuroStrings),
        warning: (row['warning'] || row['alerte'])?.trim(),
        imageUrl: (row['imageurl'] || row['image'])?.trim()
    };
};
const parseCsvDrafts = (content) => {
    const lines = content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
    if (lines.length < 2) {
        throw new Error('Le fichier CSV doit contenir un en-tête et au moins une ligne.');
    }
    const headers = parseCsvLine(lines[0]).map(header => header.toLowerCase());
    const drafts = lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        if (values.every(value => value.trim().length === 0)) {
            return null;
        }
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] ?? '';
        });
        return mapRowToDraft(row);
    })
        .filter((draft) => Boolean(draft && draft.title && draft.description));
    return drafts;
};
const parseJsonDrafts = (content) => {
    let data;
    try {
        data = JSON.parse(content);
    }
    catch {
        throw new Error('JSON invalide. Veuillez vérifier la structure du fichier.');
    }
    const entries = Array.isArray(data) ? data : [data];
    const drafts = entries.map((entry) => {
        if (typeof entry !== 'object' || entry === null) {
            return null;
        }
        const obj = entry;
        const title = typeof obj.title === 'string' ? obj.title : '';
        const description = typeof obj.description === 'string' ? obj.description : '';
        return {
            title: title.trim(),
            description: description.trim(),
            duration: typeof obj.duration === 'string' ? obj.duration : undefined,
            steps: splitStepsInput(obj.steps),
            tags: splitToList(obj.tags),
            situation: mapStringsToSituations(splitToList(obj.situations ?? obj.situation)),
            neurotypes: mapStringsToNeurotypes(splitToList(obj.neurotypes ?? obj.neurotype)),
            warning: typeof obj.warning === 'string' ? obj.warning.trim() : undefined,
            imageUrl: typeof obj.imageUrl === 'string'
                ? obj.imageUrl
                : typeof obj.image === 'string'
                    ? obj.image
                    : undefined,
        };
    }).filter((draft) => Boolean(draft && draft.title && draft.description));
    return drafts;
};
const createEmptyPartnerForm = () => ({
    title: '',
    description: '',
    duration: '5 min',
    warning: '',
    imageUrl: '',
    situation: [Situation.Stress],
    steps: [''],
    tagsText: 'Partenaire',
    neurotypes: []
});
const LegacyPartnerPortal = ({ onBack }) => {
    const { t } = useTranslation(['common', 'partner']);
    const [activeAccount, setActiveAccount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authMode, setAuthMode] = useState('login');
    const [authForm, setAuthForm] = useState({
        organization: '',
        contactName: '',
        email: '',
        password: ''
    });
    const [authError, setAuthError] = useState(null);
    const [manualForm, setManualForm] = useState(createEmptyPartnerForm());
    const [manualFeedback, setManualFeedback] = useState(null);
    const [importFeedback, setImportFeedback] = useState(null);
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { user } = await apiClient.getMe();
                setActiveAccount({
                    id: user.id,
                    organization: user.organization,
                    contactName: user.contactName,
                    email: user.email,
                    role: user.role,
                    status: 'active',
                    password: '' // Not needed/secure
                });
            }
            catch (e) {
                setActiveAccount(null);
            }
            finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);
    const emitSessionChange = (session) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('partner-session-change', { detail: session }));
        }
    };
    const handleLogout = async () => {
        try {
            await apiClient.logout();
            setActiveAccount(null);
            emitSessionChange(null);
        }
        catch (e) {
            console.error('Logout failed', e);
        }
    };
    const handleRegister = async (event) => {
        event.preventDefault();
        setAuthError(null);
        if (!authForm.organization || !authForm.contactName || !authForm.email || !authForm.password) {
            setAuthError(t('partner:auth.errors.allFieldsRequired'));
            return;
        }
        try {
            await apiClient.register({
                organization: authForm.organization.trim(),
                contactName: authForm.contactName.trim(),
                email: authForm.email.trim(),
                password: authForm.password
            });
            alert(t('partner:auth.registrationSuccess'));
            setAuthMode('login');
            setAuthForm({ organization: '', contactName: '', email: '', password: '' });
        }
        catch (error) {
            setAuthError(error.message || t('partner:auth.errors.generic'));
        }
    };
    const handleLogin = async (event) => {
        event.preventDefault();
        setAuthError(null);
        if (!authForm.email || !authForm.password) {
            setAuthError(t('partner:auth.errors.missingCredentials'));
            return;
        }
        try {
            const { user } = await apiClient.login({
                email: authForm.email,
                password: authForm.password
            });
            const account = {
                id: user.id,
                organization: user.organization,
                contactName: user.contactName,
                email: user.email,
                role: user.role,
                status: 'active',
                password: ''
            };
            setActiveAccount(account);
            emitSessionChange(account);
            setAuthForm({ organization: '', contactName: '', email: '', password: '' });
        }
        catch (error) {
            setAuthError(error.message || t('partner:auth.errors.invalidCredentials'));
        }
    };
    const handleManualSubmit = (event) => {
        event.preventDefault();
        setManualFeedback(null);
        if (!activeAccount) {
            setManualFeedback({ type: 'error', text: t('partner:manual.loginRequired') });
            return;
        }
        if (!manualForm.title.trim() || !manualForm.description.trim()) {
            setManualFeedback({ type: 'error', text: t('partner:manual.validationError') });
            return;
        }
        const tagsList = splitToList(manualForm.tagsText, /[,;|]/);
        const draft = {
            title: manualForm.title.trim(),
            description: manualForm.description.trim(),
            duration: manualForm.duration.trim(),
            warning: manualForm.warning.trim() || undefined,
            imageUrl: manualForm.imageUrl.trim() || undefined,
            steps: manualForm.steps.map(step => step.trim()).filter(Boolean),
            tags: tagsList,
            situation: manualForm.situation.length ? manualForm.situation : [Situation.Stress],
            neurotypes: manualForm.neurotypes,
        };
        const exercise = createPartnerExercise(draft, `${activeAccount.organization} • ${activeAccount.contactName}`);
        saveExercise(exercise);
        setManualFeedback({ type: 'success', text: t('partner:manual.success') });
        setManualForm(createEmptyPartnerForm());
    };
    const toggleSituation = (value) => {
        setManualForm(prev => {
            const exists = prev.situation.includes(value);
            const situation = exists ? prev.situation.filter(item => item !== value) : [...prev.situation, value];
            return { ...prev, situation };
        });
    };
    const toggleNeurotype = (value) => {
        setManualForm(prev => {
            const exists = prev.neurotypes.includes(value);
            const neurotypes = exists ? prev.neurotypes.filter(item => item !== value) : [...prev.neurotypes, value];
            return { ...prev, neurotypes };
        });
    };
    const handleStepChange = (index, value) => {
        setManualForm(prev => {
            const steps = [...prev.steps];
            steps[index] = value;
            return { ...prev, steps };
        });
    };
    const addStepField = () => {
        setManualForm(prev => ({ ...prev, steps: [...prev.steps, ''] }));
    };
    const removeStepField = (index) => {
        setManualForm(prev => ({ ...prev, steps: prev.steps.filter((_, idx) => idx !== index) }));
    };
    const handleFileUpload = (event) => {
        if (!activeAccount)
            return;
        const file = event.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const content = reader.result ? String(reader.result) : '';
                const drafts = file.name.toLowerCase().endsWith('.json')
                    ? parseJsonDrafts(content)
                    : parseCsvDrafts(content);
                if (drafts.length === 0) {
                    setImportFeedback({ type: 'error', text: t('partner:import.noValidExercise') });
                    setFileInputKey(Date.now());
                    return;
                }
                drafts.forEach(draft => {
                    const exercise = createPartnerExercise(draft, activeAccount.organization);
                    saveExercise(exercise);
                });
                setImportFeedback({
                    type: 'success',
                    text: t('partner:import.success', { count: drafts.length, fileName: file.name })
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : t('partner:import.error');
                setImportFeedback({ type: 'error', text: message });
            }
            finally {
                setFileInputKey(Date.now());
            }
        };
        reader.readAsText(file);
    };
    const renderAuthForm = () => (_jsx("div", { className: "max-w-xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-sm p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Lock, { className: "w-8 h-8 text-slate-600" }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: authMode === 'login' ? t('partner:auth.loginTitle') : t('partner:auth.registerTitle') }), _jsx("p", { className: "text-sm text-slate-500", children: t('partner:auth.accessRestricted') })] })] }), _jsxs("form", { onSubmit: authMode === 'login' ? handleLogin : handleRegister, className: "space-y-4", children: [authMode === 'register' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:auth.organization') }), _jsx("input", { className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: authForm.organization, onChange: e => setAuthForm(prev => ({ ...prev, organization: e.target.value })), placeholder: t('partner:auth.organizationPlaceholder'), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:auth.contactName') }), _jsx("input", { className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: authForm.contactName, onChange: e => setAuthForm(prev => ({ ...prev, contactName: e.target.value })), placeholder: t('partner:auth.contactNamePlaceholder'), required: true })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:auth.email') }), _jsx("input", { type: "email", className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: authForm.email, onChange: e => setAuthForm(prev => ({ ...prev, email: e.target.value })), placeholder: t('partner:auth.emailPlaceholder'), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:auth.password') }), _jsx("input", { type: "password", className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: authForm.password, onChange: e => setAuthForm(prev => ({ ...prev, password: e.target.value })), placeholder: t('partner:auth.passwordPlaceholder'), required: true })] }), authError && (_jsx("div", { className: "text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3", children: authError })), _jsx(Button, { type: "submit", className: "w-full", size: "lg", children: authMode === 'login' ? t('partner:auth.loginAction') : t('partner:auth.createAccess') })] }), _jsx("div", { className: "text-center text-sm text-slate-500", children: authMode === 'login' ? (_jsxs("button", { type: "button", className: "text-teal-600 font-medium", onClick: () => { setAuthMode('register'); setAuthError(null); }, children: [_jsx(UserPlus, { className: "inline w-4 h-4 mr-1" }), " ", t('partner:auth.createAccountLink')] })) : (_jsxs("button", { type: "button", className: "text-teal-600 font-medium", onClick: () => { setAuthMode('login'); setAuthError(null); }, children: [_jsx(User, { className: "inline w-4 h-4 mr-1" }), " ", t('partner:auth.hasAccountLink')] })) })] }) }));
    const renderWorkspace = () => (_jsxs("div", { className: "space-y-8", children: [activeAccount && (_jsxs("div", { className: "bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm uppercase tracking-wide text-slate-400", children: t('partner:workspace.verifiedAccount') }), _jsx("h2", { className: "text-2xl font-semibold text-slate-900", children: activeAccount.organization }), _jsx("p", { className: "text-sm text-slate-500", children: t('partner:workspace.referent', { name: activeAccount.contactName }) }), _jsx("p", { className: "text-sm text-slate-500", children: t('partner:workspace.email', { email: activeAccount.email }) })] }), _jsxs(Button, { variant: "ghost", onClick: handleLogout, children: [_jsx(LogOut, { className: "w-4 h-4 mr-2" }), " ", t('partner:workspace.logout')] })] })), _jsxs("section", { className: "bg-white rounded-2xl shadow-sm p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ClipboardList, { className: "w-6 h-6 text-teal-600" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: t('partner:manual.title') }), _jsx("p", { className: "text-sm text-slate-500", children: t('partner:manual.subtitle') })] })] }), manualFeedback && (_jsx("div", { className: `text-sm rounded-xl border px-4 py-3 ${manualFeedback.type === 'success'
                            ? 'bg-teal-50 border-teal-200 text-teal-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'}`, children: manualFeedback.text })), _jsxs("form", { onSubmit: handleManualSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:manual.form.title') }), _jsx("input", { className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: manualForm.title, onChange: e => setManualForm(prev => ({ ...prev, title: e.target.value })), placeholder: t('partner:manual.form.titlePlaceholder'), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:manual.form.duration') }), _jsx("input", { className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: manualForm.duration, onChange: e => setManualForm(prev => ({ ...prev, duration: e.target.value })), placeholder: t('partner:manual.form.durationPlaceholder') })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:manual.form.description') }), _jsx("textarea", { className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: manualForm.description, onChange: e => setManualForm(prev => ({ ...prev, description: e.target.value })), rows: 4, placeholder: t('partner:manual.form.descriptionPlaceholder'), required: true })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:manual.form.image') }), _jsx("input", { className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: manualForm.imageUrl, onChange: e => setManualForm(prev => ({ ...prev, imageUrl: e.target.value })), placeholder: t('partner:manual.form.imagePlaceholder') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:manual.form.warning') }), _jsx("input", { className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: manualForm.warning, onChange: e => setManualForm(prev => ({ ...prev, warning: e.target.value })), placeholder: t('partner:manual.form.warningPlaceholder') })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: t('partner:manual.form.tags') }), _jsx("input", { className: "w-full border border-slate-200 rounded-lg px-3 py-2", value: manualForm.tagsText, onChange: e => setManualForm(prev => ({ ...prev, tagsText: e.target.value })), placeholder: t('partner:manual.form.tagsPlaceholder') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: t('partner:manual.form.situations') }), _jsx("div", { className: "flex flex-wrap gap-2", children: Object.values(Situation).map(item => (_jsx("button", { type: "button", onClick: () => toggleSituation(item), className: `px-3 py-1 rounded-full text-xs border ${manualForm.situation.includes(item)
                                                ? 'bg-teal-600 text-white border-teal-600'
                                                : 'bg-slate-50 border-slate-200 text-slate-600'}`, children: t(`situations.${item}`) }, item))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: t('partner:manual.form.neurotypes') }), _jsx("div", { className: "flex flex-wrap gap-2", children: Object.values(NeuroType).filter(type => type !== NeuroType.None).map(type => (_jsx("button", { type: "button", onClick: () => toggleNeurotype(type), className: `px-3 py-1 rounded-full text-xs border ${manualForm.neurotypes.includes(type)
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white border-slate-200 text-slate-600'}`, children: t(`neuroTypes.${type}`) }, type))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: t('partner:manual.form.detailedSteps') }), _jsx("div", { className: "space-y-2", children: manualForm.steps.map((step, index) => (_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { className: "flex-1 border border-slate-200 rounded-lg px-3 py-2", value: step, onChange: e => handleStepChange(index, e.target.value), placeholder: t('partner:manual.form.stepPlaceholder', { number: index + 1 }) }), manualForm.steps.length > 1 && (_jsx(Button, { type: "button", variant: "ghost", onClick: () => removeStepField(index), children: t('partner:manual.form.deleteStep') }))] }, index))) }), _jsx(Button, { type: "button", variant: "secondary", size: "sm", className: "mt-3", onClick: addStepField, children: t('partner:manual.form.addStep') })] }), _jsx("div", { className: "pt-4", children: _jsx(Button, { type: "submit", size: "lg", className: "w-full", children: t('partner:manual.publish') }) })] })] }), _jsxs("section", { className: "bg-white rounded-2xl shadow-sm p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(UploadCloud, { className: "w-6 h-6 text-teal-600" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: t('partner:import.title') }), _jsx("p", { className: "text-sm text-slate-500", children: t('partner:import.subtitle') })] })] }), importFeedback && (_jsx("div", { className: `text-sm rounded-xl border px-4 py-3 ${importFeedback.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'}`, children: importFeedback.text })), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "border border-dashed border-slate-200 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-slate-700 font-medium mb-2", children: [_jsx(FileSpreadsheet, { className: "w-4 h-4" }), " ", t('partner:import.csvFormat')] }), _jsx("p", { className: "text-sm text-slate-500 mb-2", children: t('partner:import.csvHeaders') }), _jsx("p", { className: "text-xs text-slate-400", children: t('partner:import.csvSeparator') })] }), _jsxs("div", { className: "border border-dashed border-slate-200 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-slate-700 font-medium mb-2", children: [_jsx(FileSpreadsheet, { className: "w-4 h-4" }), " ", t('partner:import.jsonFormat')] }), _jsx("p", { className: "text-sm text-slate-500 mb-2", children: t('partner:import.jsonStructure') }), _jsx("p", { className: "text-xs text-slate-400", children: t('partner:import.jsonExample') })] })] }), _jsxs("div", { className: "bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3", children: [_jsx("p", { className: "text-sm text-slate-600", children: t('partner:import.fileInput') }), _jsx("input", { type: "file", accept: ".csv,.json,application/json,text/csv", onChange: handleFileUpload, className: "w-full text-sm" }, fileInputKey)] })] })] }));
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("header", { className: "bg-white border-b border-slate-100", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 py-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "bg-teal-600 text-white rounded-xl p-2", children: _jsx(Building2, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: t('partner:workspace.backoffice') }), _jsx("h1", { className: "text-2xl font-semibold text-slate-900", children: t('partner:workspace.partnerSpace') })] })] }), _jsx("div", { className: "flex gap-2", children: _jsxs(Button, { variant: "outline", onClick: onBack, children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), " ", t('partner:workspace.backToCatalog')] }) })] }) }), _jsx("main", { className: "max-w-5xl mx-auto px-4 py-8", children: isLoading ? _jsx("div", { className: "text-center py-8", children: "Loading..." }) : (activeAccount ? renderWorkspace() : renderAuthForm()) })] }));
};
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
    // Dummy state for moderation panel props since we reuse it
    const [pendingExercises, setPendingExercises] = useState([]);
    const [reviewedExercises, setReviewedExercises] = useState([]);
    const [moderationStatus, setModerationStatus] = useState(null);
    const loadAccounts = useCallback(async () => {
        setIsLoadingAccounts(true);
        setAccountsError(null);
        try {
            const response = await apiClient.fetchPartners();
            const mapped = response.partners.map(acc => ({
                ...acc,
                password: ''
            }));
            setAccounts(mapped);
        }
        catch (error) {
            setAccountsError(error.message || 'Unable to load partner accounts');
        }
        finally {
            setIsLoadingAccounts(false);
        }
    }, []);
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
            setMetricsError(error.message || 'Unable to load platform metrics');
        }
        finally {
            setIsLoadingMetrics(false);
        }
    }, [metricsUpdatedAt]);
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
                label: 'Total Thanks',
                value: metrics.totalThanks,
                subLabel: `${formatNumber(metrics.approvedExercises)} approved exercises`,
                icon: Heart,
                iconColor: 'text-rose-500',
                iconBg: 'bg-rose-50'
            },
            {
                label: 'Exercises in DB',
                value: metrics.totalExercises,
                subLabel: `${formatNumber(metrics.pendingModeration)} pending moderation`,
                icon: ClipboardList,
                iconColor: 'text-indigo-600',
                iconBg: 'bg-indigo-50'
            },
            {
                label: 'Users',
                value: metrics.totalUsers,
                subLabel: `${formatNumber(metrics.activeUsers)} active / ${formatNumber(metrics.pendingUsers)} pending`,
                icon: Users,
                iconColor: 'text-slate-700',
                iconBg: 'bg-slate-50'
            },
            {
                label: 'Content Mix',
                value: metrics.partnerExercises + metrics.communityExercises,
                subLabel: `${formatNumber(metrics.partnerExercises)} partner / ${formatNumber(metrics.communityExercises)} community`,
                icon: BarChart3,
                iconColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50'
            }
        ]
        : [];
    const handleUpdateStatus = async (id, status) => {
        setActionInProgress(id);
        setAccountsError(null);
        try {
            if (status === 'active') {
                await apiClient.approvePartner(id);
            }
            else {
                await apiClient.rejectPartner(id);
            }
            await loadAccounts();
        }
        catch (error) {
            setAccountsError(error.message || 'Unable to update account status');
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
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("header", { className: "bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ShieldCheck, { className: "w-8 h-8 text-teal-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-widest text-slate-400", children: "NeuroSooth" }), _jsx("h1", { className: "text-xl font-bold", children: "Admin Dashboard" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { variant: "secondary", size: "sm", onClick: () => setViewMode('batchTranslation'), children: [_jsx(Languages, { className: "w-4 h-4 mr-2" }), "Batch Traductions"] }), _jsxs(Button, { variant: "secondary", size: "sm", onClick: () => setViewMode('moderation'), children: [_jsx(ClipboardList, { className: "w-4 h-4 mr-2" }), "Moderation Content"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleLogout, className: "border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800", children: [_jsx(LogOut, { className: "w-4 h-4 mr-2" }), "Logout"] })] })] }) }), _jsxs("main", { className: "max-w-6xl mx-auto px-4 py-8 space-y-8", children: [_jsxs("section", { className: "bg-white rounded-2xl shadow-sm p-6 border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Activity, { className: "w-6 h-6 text-emerald-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Live overview" }), _jsx("h2", { className: "text-lg font-bold text-slate-900", children: "Platform metrics" })] })] }), _jsx("div", { className: "text-xs text-slate-500", children: metricsUpdatedAt
                                            ? `Updated ${new Date(metricsUpdatedAt).toLocaleTimeString()}`
                                            : 'Awaiting first sync' })] }), metricsError && (_jsx("div", { className: "mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800", children: metricsError })), isLoadingMetrics && !metrics ? (_jsx("p", { className: "text-slate-500 italic", children: "Loading platform metrics..." })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: metricCards.map(card => (_jsxs("div", { className: "p-4 border border-slate-100 rounded-xl bg-slate-50/60 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: card.label }), _jsx("p", { className: "text-2xl font-bold text-slate-900", children: formatNumber(card.value) }), card.subLabel && _jsx("p", { className: "text-xs text-slate-500", children: card.subLabel })] }), _jsx("div", { className: `p-3 rounded-lg ${card.iconBg}`, children: _jsx(card.icon, { className: `w-6 h-6 ${card.iconColor}` }) })] }, card.label))) }))] }), _jsxs("section", { className: "bg-white rounded-2xl shadow-sm p-6 border border-slate-200", children: [_jsx("div", { className: "flex items-center justify-between mb-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(UserPlus, { className: "w-6 h-6 text-amber-500" }), _jsxs("h2", { className: "text-lg font-bold text-slate-900", children: ["Pending Registrations (", pendingAccounts.length, ")"] })] }) }), accountsError && (_jsx("div", { className: "mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700", children: accountsError })), isLoadingAccounts ? (_jsx("p", { className: "text-slate-500 italic", children: "Loading partner accounts..." })) : pendingAccounts.length === 0 ? (_jsx("p", { className: "text-slate-500 italic", children: "No pending account requests." })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm text-slate-600", children: [_jsx("thead", { className: "bg-slate-50 text-xs uppercase font-semibold text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 rounded-l-lg", children: "Organization" }), _jsx("th", { className: "px-4 py-3", children: "Contact" }), _jsx("th", { className: "px-4 py-3", children: "Email" }), _jsx("th", { className: "px-4 py-3 rounded-r-lg text-right", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: pendingAccounts.map(acc => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-900", children: acc.organization }), _jsx("td", { className: "px-4 py-3", children: acc.contactName }), _jsx("td", { className: "px-4 py-3", children: acc.email }), _jsxs("td", { className: "px-4 py-3 text-right flex justify-end gap-2", children: [_jsx(Button, { size: "sm", variant: "ghost", className: "text-rose-600 hover:bg-rose-50", onClick: () => handleUpdateStatus(acc.id, 'rejected'), disabled: actionInProgress === acc.id, children: actionInProgress === acc.id ? 'Processing...' : 'Reject' }), _jsx(Button, { size: "sm", onClick: () => handleUpdateStatus(acc.id, 'active'), disabled: actionInProgress === acc.id, children: actionInProgress === acc.id ? 'Saving...' : 'Approve' })] })] }, acc.id))) })] }) }))] }), _jsxs("section", { className: "bg-white rounded-2xl shadow-sm p-6 border border-slate-200", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx(Building2, { className: "w-6 h-6 text-teal-600" }), _jsxs("h2", { className: "text-lg font-bold text-slate-900", children: ["Active Partners (", activeAccounts.length, ")"] })] }), isLoadingAccounts ? (_jsx("p", { className: "text-slate-500 italic", children: "Loading partner accounts..." })) : activeAccounts.length === 0 ? (_jsx("p", { className: "text-slate-500 italic", children: "No active partners yet." })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: activeAccounts.map(acc => (_jsxs("div", { className: "p-4 border border-slate-100 rounded-xl hover:border-teal-200 transition-colors", children: [_jsx("h3", { className: "font-semibold text-slate-900", children: acc.organization }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: acc.contactName }), _jsx("p", { className: "text-xs text-slate-400", children: acc.email }), acc.role === 'admin' && _jsx("span", { className: "inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded", children: "Admin" })] }, acc.id))) }))] })] })] }));
};
// --- Main App ---
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
    const isNavigatingRef = useRef(false);
    // Navigation handler to update view based on history state
    const navigateTo = useCallback((newView, exerciseId) => {
        if (isNavigatingRef.current)
            return;
        isNavigatingRef.current = true;
        const state = { view: newView, exerciseId };
        window.history.pushState(state, '', window.location.pathname);
        setView(newView);
        if (newView === 'detail' && exerciseId) {
            const exercise = translatedExercises.find(ex => ex.id === exerciseId);
            if (exercise)
                setSelectedExercise(exercise);
        }
        setTimeout(() => {
            isNavigatingRef.current = false;
        }, 100);
    }, [translatedExercises]);
    const navigateBack = useCallback(() => {
        if (isNavigatingRef.current)
            return;
        // Determine where to go back to
        if (view === 'detail' || view === 'add' || view === 'moderation' || view === 'partner' || view === 'admin') {
            setView('dashboard');
            setSelectedExercise(null);
        }
        else if (view === 'onboarding') {
            // Can't go back from onboarding
            return;
        }
    }, [view]);
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
            event.preventDefault();
            navigateBack();
        };
        window.addEventListener('popstate', handlePopState);
        // Handle native back button for Capacitor (Android/iOS)
        const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
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
                // Navigate back within the app
                navigateBack();
            }
        });
        return () => {
            window.removeEventListener('popstate', handlePopState);
            backButtonListener.remove();
        };
    }, [navigateBack, view]);
    // Push initial history state
    useEffect(() => {
        if (window.history.state === null) {
            window.history.replaceState({ view: 'dashboard' }, '', window.location.pathname);
        }
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
                    status: 'active',
                    password: ''
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
        setView('dashboard');
    };
    const handleExerciseClick = (ex) => {
        setSelectedExercise(ex);
        navigateTo('detail', ex.id);
    };
    const handleAddExercise = (newEx) => {
        saveExercise(newEx);
        setView('dashboard');
    };
    const handleThanks = (exId) => {
        incrementThanks(exId);
    };
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
    const showSyncStatus = !syncStatus.isOnline || syncStatus.pendingMutations > 0 || syncStatus.isSyncing;
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
