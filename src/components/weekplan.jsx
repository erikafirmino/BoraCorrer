// ============================================================
// weekplan.jsx
// Tela principal do BoraCorrer — Plano semanal.
// Header limpo: apenas streak + avatar.
// Ícones de calendário, histórico e configurações → Bottom Nav.
// ============================================================

import React, { useState } from 'react';
import { getTotalDurationSeconds, TOTAL_WEEKS, DAYS_PER_WEEK } from '../data/plans.js';
import { useStreak }                            from '../hooks/usestreak.js';
import { useAchievements, getMotivationalPhrase } from '../hooks/useachievements.js';
import { getPersonalizedMessage }               from './profilesetup.jsx';
import ProfileModal from './profilemodal.jsx';
import './weekplan.css';

// ============================================================
// Helpers
// ============================================================

function formatDuration(totalSeconds) {
    const minutes = Math.round(totalSeconds / 60);
    return `${minutes} min`;
}

// ============================================================
// Sub-componentes
// ============================================================

function OverallProgress({ completedDays, totalWeeks }) {
    const totalDays      = totalWeeks * DAYS_PER_WEEK;
    const completedCount = completedDays.length;
    const percent        = Math.round((completedCount / totalDays) * 100);

    return (
        <div className="overall-progress">
            <div className="overall-progress-header">
                <span className="overall-progress-label">🏆 Progresso geral</span>
                <span className="overall-progress-value">
                    {completedCount}/{totalDays} treinos · {percent}%
                </span>
            </div>
            <div className="overall-progress-bar">
                <div
                    className="overall-progress-fill"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

function SpotifyButton() {
    function openSpotify() {
        const spotifyUrl = 'spotify:playlist:37i9dQZF1DX70RN3TfWWJh';
        const webUrl     = 'https://open.spotify.com/playlist/37i9dQZF1DX70RN3TfWWJh';
        window.location  = spotifyUrl;
        setTimeout(() => window.open(webUrl, '_blank'), 500);
    }

    return (
        <button className="spotify-btn" onClick={openSpotify}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Música para correr
        </button>
    );
}

// ============================================================
// Componente principal
// ============================================================

export default function WeekPlan({
    weekPlan,
    completedDays,
    currentWeek,
    totalWeeks,
    currentPlanId,
    onStartDay,
    onChangeWeek,
    onOpenModeSelect,
    userName,
    userUid,
    userProfile,
    user,
    onUpdateName,
}) {
    const days         = [1, 2, 3];
    const { streak }   = useStreak(completedDays);
    const achievements = useAchievements(completedDays, streak);

    const [showProfile, setShowProfile] = useState(false);

    const firstName       = userName ? userName.split(' ')[0] : '';
    const motivationalMsg = completedDays.length > 0
        ? getMotivationalPhrase(completedDays)
        : getPersonalizedMessage(userProfile);

    return (
        <div className="weekplan-container">

            {/* ======== HERO ======== */}
            <div className="weekplan-hero">

                {/* Top bar: streak + avatar */}
                <div className="weekplan-topbar">
                    <div className="streak-badge">
                        🔥 {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
                    </div>

                    {/* Avatar clicável — abre modal de perfil */}
                    <button
                        className="topbar-avatar-btn"
                        onClick={() => setShowProfile(true)}
                        title="Ver perfil"
                    >
                        <div className="topbar-avatar">
                            {(firstName || '?')[0].toUpperCase()}
                        </div>
                    </button>
                </div>

                {/* Saudação */}
                <div className="user-greeting-block">
                    <div className="user-greeting">Olá, {firstName}! 👋</div>
                    <div className="user-sub">
                        {achievements.unlocked.length} conquista{achievements.unlocked.length !== 1 ? 's' : ''} · toque no avatar
                    </div>
                </div>

                {/* Card de dica motivacional */}
                {motivationalMsg && (
                    <div className="motivational-msg">
                        💡 {motivationalMsg}
                    </div>
                )}

                {/* Navegação semanal */}
                <header className="weekplan-header">
                    <button
                        className="week-nav-btn"
                        disabled={currentWeek <= 1}
                        onClick={() => onChangeWeek(currentWeek - 1)}
                    >
                        ‹
                    </button>
                    <div className="week-title-block">
                        <h1>{weekPlan.title}</h1>
                        <p>{weekPlan.description}</p>
                    </div>
                    <button
                        className="week-nav-btn"
                        disabled={currentWeek >= totalWeeks}
                        onClick={() => onChangeWeek(currentWeek + 1)}
                    >
                        ›
                    </button>
                </header>

            </div>

            {/* ======== BODY ======== */}
            <div className="weekplan-body">

                {/* Plano ativo + trocar */}
                <div className="plan-mode-row">
                    <div className="plan-mode-badge">
                        {currentPlanId === '5k' ? '🏃 Plano 5K' : '🏆 Plano 10K'}
                    </div>
                    <button className="plan-mode-btn" onClick={onOpenModeSelect}>
                        Trocar treino ›
                    </button>
                </div>

                {/* Progresso geral */}
                <OverallProgress completedDays={completedDays} totalWeeks={totalWeeks} />

                {/* Spotify */}
                <SpotifyButton />

                {/* Cards de treino */}
                <div className="days-list">
                    {days.map((day) => {
                        const dayKey = `${currentWeek}-${day}`;
                        const isDone = completedDays.includes(dayKey);

                        return (
                            <div
                                className={`day-card ${isDone ? 'day-done' : ''}`}
                                key={dayKey}
                            >
                                <div className="day-info">
                                    <div className="day-checkbox">
                                        {isDone ? '✓' : day}
                                    </div>
                                    <div>
                                        <div className="day-name">Dia {day}</div>
                                        <div className="day-duration">
                                            {formatDuration(getTotalDurationSeconds(weekPlan.workout))}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className={`day-action-btn ${isDone ? 'redo' : 'start'}`}
                                    onClick={() => onStartDay(dayKey)}
                                >
                                    {isDone ? 'Refazer' : 'Iniciar'}
                                </button>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* Modal de perfil */}
            {showProfile && (
                <ProfileModal
                    user={user}
                    achievements={achievements}
                    onSave={onUpdateName}
                    onClose={() => setShowProfile(false)}
                />
            )}

        </div>
    );
}
