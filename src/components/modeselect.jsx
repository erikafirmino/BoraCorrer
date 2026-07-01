import React, { useState } from 'react';
import { THEMED_WORKOUTS, getTotalDurationSeconds } from '../data/plans.js';
import './modeselect.css';

function formatDuration(seconds) {
    const m = Math.round(seconds / 60);
    return `${m} min`;
}

export default function ModeSelect({ currentPlanId, completedDays, onSelectPlan, onStartFreeWorkout, onClose }) {
    const [tab, setTab] = useState('plans'); // plans | themed

    const has5kCompleted = completedDays.filter(d => d.startsWith('5k-') || !d.includes('-plan-')).length >= 24;

    return (
        <div className="mode-overlay" onClick={onClose}>
            <div className="mode-sheet" onClick={e => e.stopPropagation()}>
                <div className="mode-handle" />

                <h2 className="mode-title">Escolher Treino</h2>

                <div className="mode-tabs">
                    <button
                        className={`mode-tab ${tab === 'plans' ? 'active' : ''}`}
                        onClick={() => setTab('plans')}
                    >
                        📋 Planos
                    </button>
                    <button
                        className={`mode-tab ${tab === 'themed' ? 'active' : ''}`}
                        onClick={() => setTab('themed')}
                    >
                        ⚡ Temáticos
                    </button>
                </div>

                {tab === 'plans' && (
                    <div className="mode-list">
                        {/* Plano 5K */}
                        <div
                            className={`plan-card ${currentPlanId === '5k' ? 'active-plan' : ''}`}
                            onClick={() => onSelectPlan('5k')}
                        >
                            <div className="plan-card-emoji">🏃</div>
                            <div className="plan-card-info">
                                <div className="plan-card-title">Do Zero ao 5K</div>
                                <div className="plan-card-desc">8 semanas · Iniciantes</div>
                            </div>
                            {currentPlanId === '5k' && <div className="plan-badge">Atual</div>}
                        </div>

                        {/* Plano 10K */}
                        <div
                            className={`plan-card ${currentPlanId === '10k' ? 'active-plan' : ''} ${!has5kCompleted ? 'locked-plan' : ''}`}
                            onClick={() => has5kCompleted ? onSelectPlan('10k') : null}
                        >
                            <div className="plan-card-emoji">{has5kCompleted ? '🏆' : '🔒'}</div>
                            <div className="plan-card-info">
                                <div className="plan-card-title">Do 5K ao 10K</div>
                                <div className="plan-card-desc">
                                    {has5kCompleted
                                        ? '8 semanas · Intermediário'
                                        : 'Complete o 5K para desbloquear'}
                                </div>
                            </div>
                            {currentPlanId === '10k' && <div className="plan-badge">Atual</div>}
                        </div>

                        {/* Modo Livre */}
                        <div className="plan-card free-card" onClick={onStartFreeWorkout}>
                            <div className="plan-card-emoji">🎯</div>
                            <div className="plan-card-info">
                                <div className="plan-card-title">Modo Livre</div>
                                <div className="plan-card-desc">Defina sua duração e corra</div>
                            </div>
                            <div className="plan-badge free">Novo</div>
                        </div>
                    </div>
                )}

                {tab === 'themed' && (
                    <div className="mode-list">
                        {THEMED_WORKOUTS.map(w => (
                            <div
                                key={w.id}
                                className="themed-card"
                                onClick={() => onStartFreeWorkout(w.workout, w.title)}
                            >
                                <div className="themed-emoji">{w.emoji}</div>
                                <div className="themed-info">
                                    <div className="themed-title">{w.title}</div>
                                    <div className="themed-desc">{w.description}</div>
                                </div>
                                <div className="themed-duration">
                                    {formatDuration(getTotalDurationSeconds(w.workout))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button className="mode-close" onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
}
