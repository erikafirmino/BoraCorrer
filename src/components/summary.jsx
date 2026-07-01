import React, { useState } from 'react';
import RunMap from './runmap.jsx';
import { exportGPX, exportTCX } from '../services/export.js';
import './summary.css';

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
    return Math.round(distanceKm * 60 + minutes * 4);
}

function shareWorkout({ totalSeconds, distanceKm, weekNumber, dayNumber, workoutTitle }) {
    const label = workoutTitle || (weekNumber ? `Semana ${weekNumber} · Dia ${dayNumber}` : 'Treino livre');
    const text =
        `🏃 Treino concluído no BoraCorrer!\n` +
        `📅 ${label}\n` +
        `⏱️ Duração: ${formatTime(totalSeconds)}\n` +
        `📍 Distância: ${formatDistance(distanceKm)} km\n` +
        `🔥 Calorias: ~${estimateCalories(totalSeconds, distanceKm)} kcal\n\n` +
        `Treine também: https://bora-correr-mu.vercel.app`;

    if (navigator.share) {
        navigator.share({ title: 'BoraCorrer - Treino Concluído', text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('Resumo copiado!');
        });
    }
}

export default function Summary({
    totalSeconds,
    distanceKm,
    route,
    weekNumber,
    dayNumber,
    workoutTitle,
    onExit
}) {
    const calories = estimateCalories(totalSeconds, distanceKm);
    const hasRoute = route.length > 1;
    const [showExport, setShowExport] = useState(false);
    const [exported, setExported] = useState(null);

    const title = workoutTitle || `BoraCorrer S${weekNumber}D${dayNumber}`;
    const exportParams = {
        route,
        durationSeconds: totalSeconds,
        distanceKm,
        calories,
        title
    };

    function handleExport(format) {
        let ok = false;
        if (format === 'gpx') ok = exportGPX(exportParams);
        if (format === 'tcx') ok = exportTCX(exportParams);

        if (ok) {
            setExported(format.toUpperCase());
            setTimeout(() => setExported(null), 3000);
        } else {
            alert('Sem rota GPS para exportar. Ative a localização antes do treino.');
        }
        setShowExport(false);
    }

    const label = workoutTitle || (weekNumber ? `Semana ${weekNumber} · Dia ${dayNumber}` : 'Treino livre');

    return (
        <div className="summary-container">
            <div className="summary-header">
                <div className="summary-icon">🎉</div>
                <h2>Treino Concluído!</h2>
                <p className="summary-subtitle">{label}</p>
            </div>

            <div className="summary-stats">
                <div className="stat-card">
                    <div className="stat-value">{formatTime(totalSeconds)}</div>
                    <div className="stat-label">Duração</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{formatDistance(distanceKm)} km</div>
                    <div className="stat-label">Distância</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">~{calories}</div>
                    <div className="stat-label">kcal</div>
                </div>
            </div>

            {hasRoute && (
                <div className="summary-map-wrapper">
                    <RunMap route={route} />
                </div>
            )}

            {/* Botões de ação */}
            <div className="summary-actions">
                <button
                    className="btn-action"
                    onClick={() => shareWorkout({ totalSeconds, distanceKm, weekNumber, dayNumber, workoutTitle })}
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

            {exported && (
                <div className="export-success">
                    ✅ Arquivo {exported} baixado! Importe no Garmin Connect, Strava ou Apple Health.
                </div>
            )}

            <button className="btn-primary btn-full" onClick={onExit}>
                Voltar para a rotina
            </button>

            {/* Modal de exportação */}
            {showExport && (
                <div className="export-overlay" onClick={() => setShowExport(false)}>
                    <div className="export-sheet" onClick={e => e.stopPropagation()}>
                        <div className="export-handle" />
                        <h3 className="export-title">⌚ Exportar Treino</h3>
                        <p className="export-desc">Escolha o formato para importar no seu app ou wearable</p>

                        <button className="export-btn" onClick={() => handleExport('gpx')}>
                            <div className="export-btn-icon">🗺️</div>
                            <div className="export-btn-info">
                                <div className="export-btn-name">GPX</div>
                                <div className="export-btn-compat">Strava · Komoot · Google Maps · Apple Maps</div>
                            </div>
                        </button>

                        <button className="export-btn" onClick={() => handleExport('tcx')}>
                            <div className="export-btn-icon">⌚</div>
                            <div className="export-btn-info">
                                <div className="export-btn-name">TCX</div>
                                <div className="export-btn-compat">Garmin Connect · Polar · Suunto · TrainingPeaks</div>
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
