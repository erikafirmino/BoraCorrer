import React from 'react';
import { getTotalDurationSeconds } from '../data/plans.js';
import './weekplan.css';

function formatDuration(totalSeconds) {
    const minutes = Math.round(totalSeconds / 60);
    return `${minutes} min`;
}

export default function WeekPlan({ weekPlan, completedDays, currentWeek, totalWeeks, onStartDay, onChangeWeek }) {
    const days = [1, 2, 3];

    return (
        <div className="weekplan-container">
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

            <div className="week-progress-label">
                Semana {currentWeek} de {totalWeeks}
            </div>

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
    );
}
