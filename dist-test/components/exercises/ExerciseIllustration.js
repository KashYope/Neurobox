import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Situation } from '../../types.js';
const palettes = {
    breath: ['#0f766e', '#5eead4', '#ccfbf1'],
    grounding: ['#6d28d9', '#c4b5fd', '#f5f3ff'],
    movement: ['#be123c', '#fda4af', '#fff1f2'],
    sleep: ['#3730a3', '#a5b4fc', '#eef2ff'],
    focus: ['#0369a1', '#7dd3fc', '#f0f9ff'],
    comfort: ['#b45309', '#fcd34d', '#fffbeb']
};
const hashString = (value) => {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};
const kindForSituation = (situation) => {
    if (situation === Situation.Sleep || situation === Situation.Rumination)
        return 'sleep';
    if (situation === Situation.Anger || situation === Situation.Stress)
        return 'movement';
    if (situation === Situation.Focus)
        return 'focus';
    if (situation === Situation.Freeze || situation === Situation.Crisis || situation === Situation.Trauma)
        return 'grounding';
    if (situation === Situation.Pain)
        return 'comfort';
    return 'breath';
};
export const getIllustrationModel = (exercise) => {
    const hash = hashString(`${exercise.id}:${exercise.situation[0] || 'breath'}`);
    const kind = kindForSituation(exercise.situation[0]);
    const [primary, secondary, accent] = palettes[kind];
    return {
        kind,
        primary,
        secondary,
        accent,
        rotation: (hash % 19) - 9,
        variant: hash % 4
    };
};
const ProceduralArtwork = ({ exercise, className, decorative = false }) => {
    const model = getIllustrationModel(exercise);
    const gradientId = `exercise-gradient-${hashString(exercise.id).toString(36)}`;
    const shared = {
        fill: 'none',
        stroke: model.accent,
        strokeWidth: 10,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
    };
    return (_jsxs("svg", { viewBox: "0 0 1200 800", className: className, preserveAspectRatio: "xMidYMid slice", role: decorative ? undefined : 'img', "aria-hidden": decorative || undefined, "aria-label": decorative ? undefined : exercise.title, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: gradientId, x1: "0", y1: "0", x2: "1", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: model.primary }), _jsx("stop", { offset: "100%", stopColor: model.secondary })] }) }), _jsx("rect", { width: "1200", height: "800", fill: `url(#${gradientId})` }), _jsx("circle", { cx: 180 + model.variant * 35, cy: "145", r: "95", fill: model.accent, opacity: "0.12" }), _jsx("circle", { cx: "1040", cy: "650", r: 155 + model.variant * 18, fill: model.accent, opacity: "0.1" }), _jsxs("g", { transform: `rotate(${model.rotation} 600 400)`, children: [model.kind === 'breath' && (_jsxs(_Fragment, { children: [_jsx("path", { d: "M180 420 C300 270 420 570 540 420 S780 270 900 420 S1080 570 1140 420", ...shared }), _jsx("circle", { cx: "600", cy: "400", r: "135", fill: model.accent, opacity: "0.14" }), _jsx("circle", { cx: "600", cy: "400", r: "70", ...shared })] })), model.kind === 'grounding' && (_jsxs(_Fragment, { children: [[190, 140, 90].map(radius => _jsx("circle", { cx: "600", cy: "400", r: radius, ...shared, opacity: 1 - radius / 500 }, radius)), _jsx("path", { d: "M410 590 L600 400 L790 590", ...shared })] })), model.kind === 'movement' && (_jsxs(_Fragment, { children: [_jsx("path", { d: "M250 520 C390 170 560 640 710 310 C790 140 930 210 1010 370", ...shared }), _jsx("path", { d: "M890 220 L1020 350 L845 390", ...shared }), _jsx("circle", { cx: "310", cy: "300", r: "70", fill: model.accent, opacity: "0.16" })] })), model.kind === 'sleep' && (_jsxs(_Fragment, { children: [_jsx("path", { d: "M680 180 A250 250 0 1 0 880 555 A220 220 0 0 1 680 180Z", fill: model.accent, opacity: "0.2" }), [[350, 250], [820, 210], [930, 455], [430, 590]].map(([x, y]) => (_jsx("path", { d: `M${x} ${y - 24} V${y + 24} M${x - 24} ${y} H${x + 24}`, ...shared }, `${x}-${y}`)))] })), model.kind === 'focus' && (_jsxs(_Fragment, { children: [[0, 1, 2].map(row => [0, 1, 2].map(column => (_jsx("rect", { x: 410 + column * 130, y: 210 + row * 130, width: "82", height: "82", rx: "20", fill: model.accent, opacity: 0.12 + (row + column + model.variant) % 3 * 0.12 }, `${row}-${column}`)))), _jsx("circle", { cx: "600", cy: "400", r: "58", ...shared })] })), model.kind === 'comfort' && (_jsxs(_Fragment, { children: [_jsx("path", { d: "M600 610 C520 520 330 410 330 275 C330 145 505 115 600 250 C695 115 870 145 870 275 C870 410 680 520 600 610Z", fill: model.accent, opacity: "0.2" }), _jsx("path", { d: "M420 430 C500 350 700 350 780 430", ...shared })] }))] })] }));
};
export const ExerciseIllustration = ({ exercise, className = 'w-full h-full object-cover', decorative = false }) => {
    const [assetFailed, setAssetFailed] = useState(false);
    useEffect(() => setAssetFailed(false), [exercise.id, exercise.imageUrl]);
    const isGeneratedContent = exercise.isCommunitySubmitted || exercise.isPartnerContent;
    const hasSafeAsset = Boolean(exercise.imageUrl?.startsWith('/images/'));
    if (!isGeneratedContent && hasSafeAsset && !assetFailed) {
        return (_jsx("img", { src: exercise.imageUrl, alt: decorative ? '' : exercise.title, className: className, onError: () => setAssetFailed(true) }));
    }
    return _jsx(ProceduralArtwork, { exercise: exercise, className: className, decorative: decorative });
};
