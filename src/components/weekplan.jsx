import React, { useState } from 'react';
import { getTotalDurationSeconds, TOTAL_WEEKS, DAYS_PER_WEEK } from '../data/plans.js';
import { useStreak } from '../hooks/usestreak.js';
import { useTheme } from '../hooks/usetheme.js';
import { usePushNotification } from '../hooks/usepushnotification.js';
import { getPersonalizedMessage } from './profilesetup.jsx';
import Calendar from './calendar.jsx';
import './weekplan.css';

function formatDuration(totalSeconds) {
    const minutes = Math.round(totalSeconds / 60);
    return `${minutes} min`;
}

function OverallProgress({ completedDays, totalWeeks }) {
    const totalDays = totalWeeks * DAYS_PER_WEEK;
    const completedCount = completedDays.length;
    const percent = Math.round((completedCount / totalDays) * 100);

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

export default function WeekPlan({
    weekPlan,
    completedDays,
    currentWeek,
    totalWeeks,
    onStartDay,
    onChangeWeek,
    userName,
    onSwitchUser,
    userProfile
}) {
    const days = [1, 2, 3];
    const { streak } = useStreak(completedDays);
    const { isDark, toggleTheme } = useTheme();
    const { isSupported, isEnabled, scheduleReminder } = usePushNotification();
    const [showCalendar, setShowCalendar] = useState(false);

    const firstName = userName ? userName.split(' ')[0] : '';
    const motivationalMsg = getPersonalizedMessage(userProfile);

    return (
        <div className="weekplan-container">

            {/* HERO */}
            <div className="weekplan-hero">
                <div className="weekplan-topbar">
                    <div className="streak-badge">
                        🔥 {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
                    </div>
                    <div className="topbar-actions">
                        {isSupported && (
                            <button
                                className={`topbar-btn ${isEnabled ? 'active' : ''}`}
                                onClick={scheduleReminder}
                            >
                                {isEnabled ? '🔔' : '🔕'}
                            </button>
                        )}
                        <button className="topbar-btn" onClick={() => setShowCalendar(true)}>
                            📅
                        </button>
                        <button className="theme-toggle" onClick={toggleTheme}>
                            {isDark ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>

                <div className="user-row">
                    <div className="user-greeting">
                        Olá,<br />{firstName}! 👋
                    </div>
                    <button className="switch-user-btn" onClick={onSwitchUser}>
                        Trocar usuário
                    </button>
                </div>

                {motivationalMsg && (
                    <div className="motivational-msg">
                        💡 {motivationalMsg}
                    </div>
                )}

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

            {/* BODY */}
            <div className="weekplan-body">
                <div className="week-progress-label">
                    Semana {currentWeek} de {totalWeeks}
                </div>

                <OverallProgress completedDays={completedDays} totalWeeks={totalWeeks} />

                <div className="days-list">
                    {days.map((day) => {
                        const dayKey = `${currentWeek}-${day}`;
                        const isDone = completedDays.includes(dayKey);

                        return (
                            <div className={`day-card ${isDone ? 'day-done' : ''}`} key={dayKey}>
                                <div className="day-info">
                                    <div className="day-checkbox">{isDone ? '✓' : day}</div>
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

            {showCalendar && <Calendar onClose={() => setShowCalendar(false)} />}
        </div>
    );
}
