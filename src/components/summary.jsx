// ============================================================
// summary.jsx
// Tela de resumo pós-treino com coach virtual integrado.
// ============================================================

import React, { useState, useMemo } from 'react';
import RunMap from './runmap.jsx';
import CoachFeedback from './coachfeedback.jsx';
import { useCoach } from '../hooks/usecoach.js';
import { useStreak } from '../hooks/usestreak.js';
import { exportGPX, exportTCX } from '../services/export.js';
import './summary.css';

// ============================================================
// Helpers
// ============================================================

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (seconds === 0) return `${minutes} min`;
    return `${minutes}m ${seconds}s`;
}

function formatDistance(distanceKm) {
    return distanceKm.toFixed(2).replace('.', ',');
}

function estimateCalories(durationSeconds, distanceKm) {
    const minutes = durationSeconds / 60;
    return Math.round((distanceKm || 0) * 60 + minutes * 4);
}

function shareWorkout({ totalSeconds, distanceKm, weekNumber, dayNumber, workoutTitle }) {
    const label = workoutTitle
        || (weekNumber ? `Semana ${weekNumber} · Dia ${dayNumber}` : 'Treino livre');

    const text = [
        '🏃 Treino concluído no BoraCorrer!',
        `📅 ${label}`,
        `⏱️ Duração: ${formatTime(totalSeconds)}`,
        `📍 Distância: ${formatDistance(distanceKm)} km`,
        `🔥 Calorias: ~${estimateCalories(totalSeconds, distanceKm)} kcal`,
        '',
        'Treine também: https://bora-correr-mu.vercel.app'
    ].join('\n');

    if (navigator.share) {
        navigator.share({ title: 'BoraCorrer - Treino Concluído', text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('Resumo copiado!');
        });
    }
}

// ============================================================
// Componente principal
// ============================================================

export default function Summary({
    totalSeconds,
    distanceKm,
    route,
    weekNumber,
    dayNumber,
    workoutTitle,
    completedDays = [],
    userProfile = null,
    onExit
}) {
    const hasRoute = route.length > 1;
    const calories = estimateCalories(totalSeconds, distanceKm);
    const [showExport, setShowExport] = useState(false);
    const [exported, setExported] = useState(null);

    const { generateFeedback } = useCoach();
    const { streak } = useStreak(completedDays);

    // Gera o feedback do coach uma única vez ao montar o componente
    const coachFeedback = useMemo(() => generateFeedback({
        weekNumber: weekNumber || 0,
        distanceKm: distanceKm || 0,
        durationSeconds: totalSeconds,
        completedDays,
        streak,
        profile: userProfile
    }), []);

    const title = workoutTitle || `BoraCorrer S${weekNumber}D${dayNumber}`;

    const exportParams = {
        route,
        durationSeconds: totalSeconds,
        distanceKm: distanceKm || 0,
        calories,
        title
    };

    function handleExport(format) {
        const ok = format === 'gpx'
            ? exportGPX(exportParams)
            : exportTCX(exportParams);

        if (ok) {
            setExported(format.toUpperCase());
            setTimeout(() => setExported(null), 3000);
        } else {
            alert('Sem rota GPS para exportar. Ative a localização antes do treino.');
        }
        setShowExport(false);
    }

    const label = workoutTitle
        || (weekNumber ? `Semana ${weekNumber} · Dia ${dayNumber}` : 'Treino livre');

    return (
        <div className="summary-container">

            {/* Cabeçalho */}
            <div className="summary-header">
                <div className="summary-icon">🎉</div>
                <h2>Treino Concluído!</h2>
                <p className="summary-subtitle">{label}</p>
            </div>

            {/* Stats */}
            <div className="summary-stats">
                <div className="stat-card">
                    <div className="stat-value">{formatTime(totalSeconds)}</div>
                    <div className="stat-label">Duração</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{formatDistance(distanceKm || 0)} km</div>
                    <div className="stat-label">Distância</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">~{calories}</div>
                    <div className="stat-label">kcal</div>
                </div>
            </div>

            {/* Mapa */}
            {hasRoute && (
                <div className="summary-map-wrapper">
                    <RunMap route={route} />
                </div>
            )}

            {/* Coach virtual */}
            <CoachFeedback feedback={coachFeedback} />

            {/* Botões de ação */}
            <div className="summary-actions">
                <button
                    className="btn-action"
                    onClick={() => shareWorkout({
                        totalSeconds,
                        distanceKm: distanceKm || 0,
                        weekNumber,
                        dayNumber,
                        workoutTitle
                    })}
                >
                    📤 Compartilhar
                </button>

                <button
                    className="btn-action"
                    onClick={() => setShowExport(true)}
                    disabled={!hasRoute}
                    title={!hasRoute ? 'Sem rota GPS' : 'Exportar para wearable'}
                >
                    ⌚ Exportar
                </button>
            </div>

            {/* Feedback de exportação */}
            {exported && (
                <div className="export-success">
                    ✅ Arquivo {exported} baixado! Importe no Garmin Connect, Strava ou Apple Health.
                </div>
            )}

            {/* Botão de volta */}
            <button className="btn-primary btn-full" onClick={onExit}>
                Voltar para a rotina
            </button>

            {/* Modal de exportação */}
            {showExport && (
                <div className="export-overlay" onClick={() => setShowExport(false)}>
                    <div className="export-sheet" onClick={e => e.stopPropagation()}>
                        <div className="export-handle" />

                        <h3 className="export-title">⌚ Exportar Treino</h3>
                        <p className="export-desc">
                            Escolha o formato para importar no seu app ou wearable
                        </p>

                        <button className="export-btn" onClick={() => handleExport('gpx')}>
                            <div className="export-btn-icon">🗺️</div>
                            <div className="export-btn-info">
                                <div className="export-btn-name">GPX</div>
                                <div className="export-btn-compat">
                                    Strava · Komoot · Google Maps · Apple Maps
                                </div>
                            </div>
                        </button>

                        <button className="export-btn" onClick={() => handleExport('tcx')}>
                            <div className="export-btn-icon">⌚</div>
                            <div className="export-btn-info">
                                <div className="export-btn-name">TCX</div>
                                <div className="export-btn-compat">
                                    Garmin Connect · Polar · Suunto · TrainingPeaks
                                </div>
                            </div>
                        </button>

                        <div className="export-hint">
                            Após baixar, abra o app do seu wearable e importe o arquivo manualmente.
                        </div>

                        <button className="export-cancel" onClick={() => setShowExport(false)}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
