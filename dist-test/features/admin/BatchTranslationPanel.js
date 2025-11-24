import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, BadgeCheck, Button, Languages, Loader2, Radio } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
const LANGUAGE_OPTIONS = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'nl', label: 'Nederlands' }
];
const formatDate = (value) => {
    if (!value)
        return '';
    return new Date(value).toLocaleString();
};
export const BatchTranslationPanel = ({ onBack }) => {
    const [selectedLangs, setSelectedLangs] = useState(['en']);
    const [perimeter, setPerimeter] = useState('exercise');
    const [job, setJob] = useState(null);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [coverage, setCoverage] = useState([]);
    const [coverageError, setCoverageError] = useState(null);
    const [isLoadingCoverage, setIsLoadingCoverage] = useState(false);
    const [selectedExercises, setSelectedExercises] = useState(new Set());
    const progressPercent = useMemo(() => {
        if (!job || job.progress.total === 0)
            return 0;
        return Math.round((job.progress.processed / job.progress.total) * 100);
    }, [job]);
    const toggleLang = (code) => {
        setSelectedLangs(prev => prev.includes(code) ? prev.filter(lang => lang !== code) : [...prev, code]);
    };
    const submitBatch = async (event) => {
        event.preventDefault();
        if (selectedLangs.length === 0) {
            setError('Veuillez sélectionner au moins une langue cible.');
            return;
        }
        // Build stringIds set from selected exercises (if any)
        const selectedKeys = Array.from(selectedExercises);
        const stringIds = selectedKeys.length
            ? coverage
                .filter(item => selectedExercises.has(item.exerciseKey))
                .flatMap(item => item.stringIds)
            : undefined;
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                targetLangs: selectedLangs,
                perimeter: perimeter.trim() || undefined,
                stringIds: stringIds && stringIds.length ? stringIds : undefined,
                force: false
            };
            console.log('[BatchTranslation UI] Submitting batch translation:', payload);
            const newJob = await apiClient.startBatchTranslation(payload);
            console.log('[BatchTranslation UI] Job started:', newJob);
            setJob(newJob);
        }
        catch (err) {
            console.error('[BatchTranslation UI] Failed to start job:', err);
            setError(err?.message || 'Impossible de démarrer la traduction.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    useEffect(() => {
        // Initial load of translation coverage
        const loadCoverage = async () => {
            setIsLoadingCoverage(true);
            setCoverageError(null);
            try {
                const data = await apiClient.fetchTranslationCoverage({ context: 'exercise', langs: LANGUAGE_OPTIONS.map(l => l.code) });
                setCoverage(data);
            }
            catch (err) {
                console.error('[BatchTranslation UI] Failed to load translation coverage:', err);
                setCoverageError(err?.message || 'Impossible de charger l’état des traductions.');
            }
            finally {
                setIsLoadingCoverage(false);
            }
        };
        void loadCoverage();
    }, []);
    useEffect(() => {
        if (!job || job.status === 'completed' || job.status === 'failed') {
            return;
        }
        console.log('[BatchTranslation UI] Starting polling for job:', job.id);
        setIsPolling(true);
        const interval = setInterval(async () => {
            try {
                const nextStatus = await apiClient.fetchBatchTranslationStatus(job.id);
                console.log('[BatchTranslation UI] Status update:', {
                    status: nextStatus.status,
                    progress: nextStatus.progress,
                    errors: nextStatus.errors
                });
                setJob(nextStatus);
                if (nextStatus.status === 'completed' || nextStatus.status === 'failed') {
                    setIsPolling(false);
                }
            }
            catch (err) {
                console.error('[BatchTranslation UI] Failed to fetch status:', err);
                setError(err?.message || 'Erreur lors du rafraîchissement du statut.');
            }
        }, 1500);
        return () => {
            console.log('[BatchTranslation UI] Stopping polling and cleaning up interval');
            setIsPolling(false);
            clearInterval(interval);
        };
    }, [job]);
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("header", { className: "bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20", children: _jsx("div", { className: "max-w-6xl mx-auto px-4 py-4 flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "text-white hover:bg-slate-800", onClick: onBack, children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-widest text-slate-400", children: "NeuroSooth" }), _jsxs("h1", { className: "text-xl font-bold flex items-center gap-2", children: [_jsx(Languages, { className: "w-5 h-5 text-teal-300" }), "Orchestration des traductions"] })] })] }) }) }), _jsxs("main", { className: "max-w-5xl mx-auto px-4 py-8 space-y-8", children: [isPolling && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin text-blue-600" }), _jsx("span", { className: "text-sm text-blue-700", children: "Connexion active - Surveillance du statut en cours..." })] })), _jsxs("section", { className: "bg-white rounded-2xl shadow-sm border border-slate-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(BadgeCheck, { className: "w-5 h-5 text-teal-600" }), _jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "D\u00E9clencher une traduction batch" })] }), _jsx("p", { className: "text-xs text-slate-500", children: selectedExercises.size > 0
                                            ? `${selectedExercises.size} exercice(s) sélectionné(s)`
                                            : 'Aucune sélection – le périmètre sera utilisé' })] }), error && (_jsxs("div", { className: "mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4 mt-0.5" }), _jsx("span", { children: error })] })), _jsxs("form", { className: "space-y-6", onSubmit: submitBatch, children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wider text-slate-500 mb-2", children: "Langues cibles" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: LANGUAGE_OPTIONS.map((option) => (_jsxs("label", { className: "flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:border-teal-200 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedLangs.includes(option.code), onChange: () => toggleLang(option.code), className: "form-checkbox h-4 w-4 text-teal-600" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-900", children: option.label }), _jsx("p", { className: "text-xs text-slate-500", children: option.code.toUpperCase() })] })] }, option.code))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs uppercase tracking-wider text-slate-500", children: "P\u00E9rim\u00E8tre" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Radio, { className: "w-4 h-4 text-teal-600" }), _jsx("input", { type: "text", value: perimeter, onChange: (event) => setPerimeter(event.target.value), className: "flex-1 rounded-lg border border-slate-200 px-3 py-2 focus:border-teal-500 focus:outline-none", placeholder: "ex: exercise, onboarding, etc." })] }), _jsx("p", { className: "text-xs text-slate-500", children: "Le p\u00E9rim\u00E8tre est utilis\u00E9 pour filtrer les cha\u00EEnes (context) cibl\u00E9es." })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "D\u00E9marrage en cours"] })) : ('Lancer la traduction') }), _jsx(Button, { type: "button", variant: "outline", onClick: onBack, children: "Retour" })] })] })] }), _jsxs("section", { className: "bg-white rounded-2xl shadow-sm border border-slate-200 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Languages, { className: "w-5 h-5 text-teal-600" }), _jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "\u00C9tat des traductions par exercice" })] }), coverageError && (_jsxs("div", { className: "mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4 mt-0.5" }), _jsx("span", { children: coverageError })] })), isLoadingCoverage ? (_jsx("p", { className: "text-sm text-slate-500", children: "Chargement de la couverture des traductions..." })) : coverage.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Aucune cha\u00EEne d\u2019exercice trouv\u00E9e." })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm text-slate-700", children: [_jsx("thead", { className: "bg-slate-50 text-xs uppercase text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2", children: _jsx("input", { type: "checkbox", checked: selectedExercises.size > 0 && selectedExercises.size === coverage.length, onChange: (e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedExercises(new Set(coverage.map(item => item.exerciseKey)));
                                                                }
                                                                else {
                                                                    setSelectedExercises(new Set());
                                                                }
                                                            } }) }), _jsx("th", { className: "px-3 py-2 text-left", children: "Exercice" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Source" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Total cha\u00EEnes" }), LANGUAGE_OPTIONS.map(lang => (_jsx("th", { className: "px-3 py-2 text-center", children: lang.code.toUpperCase() }, lang.code)))] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: coverage.map(item => (_jsxs("tr", { className: "hover:bg-slate-50/70", children: [_jsx("td", { className: "px-3 py-2", children: _jsx("input", { type: "checkbox", checked: selectedExercises.has(item.exerciseKey), onChange: (e) => {
                                                                setSelectedExercises(prev => {
                                                                    const next = new Set(prev);
                                                                    if (e.target.checked) {
                                                                        next.add(item.exerciseKey);
                                                                    }
                                                                    else {
                                                                        next.delete(item.exerciseKey);
                                                                    }
                                                                    return next;
                                                                });
                                                            } }) }), _jsx("td", { className: "px-3 py-2 font-mono text-xs text-slate-700", children: item.exerciseKey }), _jsx("td", { className: "px-3 py-2 text-xs text-slate-500", children: item.sourceLang.toUpperCase() }), _jsx("td", { className: "px-3 py-2 text-xs", children: item.totalStrings }), LANGUAGE_OPTIONS.map(lang => {
                                                        const stats = item.perLanguage[lang.code];
                                                        const translated = stats?.translatedCount ?? 0;
                                                        const missing = stats?.missingCount ?? item.totalStrings;
                                                        const outdated = stats?.outdatedCount ?? 0;
                                                        let badgeClass = 'bg-slate-100 text-slate-700';
                                                        let label = 'Aucune';
                                                        if (translated === item.totalStrings && outdated === 0) {
                                                            badgeClass = 'bg-emerald-50 text-emerald-700';
                                                            label = 'Complet';
                                                        }
                                                        else if (translated === 0) {
                                                            badgeClass = 'bg-rose-50 text-rose-700';
                                                            label = 'Manquant';
                                                        }
                                                        else {
                                                            badgeClass = 'bg-amber-50 text-amber-700';
                                                            label = 'Partiel';
                                                        }
                                                        if (outdated > 0) {
                                                            label = `${label} (${outdated} obsolète${outdated > 1 ? 's' : ''})`;
                                                        }
                                                        return (_jsx("td", { className: "px-3 py-2 text-center text-xs", children: _jsx("span", { className: `inline-flex items-center justify-center px-2 py-1 rounded-full ${badgeClass}`, children: label }) }, lang.code));
                                                    })] }, item.exerciseKey))) })] }) }))] }), job && (_jsxs("section", { className: "bg-white rounded-2xl shadow-sm border border-slate-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Languages, { className: "w-5 h-5 text-teal-600" }), _jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Suivi de t\u00E2che" })] }), _jsx("span", { className: "text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200", children: job.status.toUpperCase() })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("p", { className: "text-sm text-slate-600", children: ["Langues : ", job.targetLangs.join(', ')] }), job.perimeter && _jsxs("p", { className: "text-sm text-slate-600", children: ["P\u00E9rim\u00E8tre : ", job.perimeter] }), _jsxs("div", { children: [_jsx("div", { className: "h-2 bg-slate-100 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${job.status === 'failed' ? 'bg-rose-500' : 'bg-teal-500'}`, style: { width: `${progressPercent}%` } }) }), _jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [job.progress.processed, "/", job.progress.total, " - ", progressPercent, "%"] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500", children: [_jsxs("div", { children: ["Cr\u00E9\u00E9e : ", formatDate(job.startedAt)] }), _jsx("div", { children: job.completedAt ? `Terminé : ${formatDate(job.completedAt)}` : 'En cours...' })] }), job.errors.length > 0 && (_jsxs("div", { className: "rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700", children: [_jsx("p", { className: "font-semibold mb-1", children: "Erreurs d\u00E9tect\u00E9es" }), _jsx("ul", { className: "list-disc pl-5 space-y-1", children: job.errors.map((errMsg, index) => (_jsx("li", { children: errMsg }, index))) })] }))] })] }))] })] }));
};
