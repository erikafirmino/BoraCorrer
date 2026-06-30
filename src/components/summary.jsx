import React from 'react';
import RunMap from './runmap.jsx';
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

function shareWorkout({ totalSeconds, distanceKm, weekNumber, dayNumber }) {
    const text =
        `🏃 Treino concluído no BoraCorrer!\n` +
        `📅 Semana ${weekNumber} · Dia ${dayNumber}\n` +
        `⏱️ Duração: ${formatTime(totalSeconds)}\n` +
        `📍 Distância: ${formatDistance(distanceKm)} km\n` +
        `🔥 Calorias: ~${estimateCalories(totalSeconds, distanceKm)} kcal\n\n` +
        `Baixe o app: https://bora-correr-mu.vercel.app`;

    if (navigator.share) {
        navigator.share({ title: 'BoraCorrer - Treino Concluído', text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('Resumo copiado para a área de transferência!');
        });
    }
}

export default function Summary({ totalSeconds, distanceKm, route, weekNumber, dayNumber, onExit }) {
    const calories = estimateCalories(totalSeconds, distanceKm);

    return (
        <div className="summary-container">
            <div className="summary-header">
                <div className="summary-icon">🎉</div>
                <h2>Treino Concluído!</h2>
                <p className="summary-subtitle">
                    Semana {weekNumber} · Dia {dayNumber}
                </p>
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

            {route.length > 1 && (
                <div className="summary-map-wrapper">
                    <RunMap route={route} />
                </div>
            )}

            <button
                className="btn-share"
                onClick={() => shareWorkout({ totalSeconds, distanceKm, weekNumber, dayNumber })}
            >
                📤 Compartilhar treino
            </button>

            <button className="btn-primary btn-full" onClick={onExit}>
                Voltar para a rotina
            </button>
        </div>
    );
}
