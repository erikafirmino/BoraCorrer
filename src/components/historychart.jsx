import React, { useState, useMemo } from 'react';
import './historychart.css';

const WEEK_NAMES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getTrainedDates() {
    try {
        const saved = localStorage.getItem('boracorrer-dates');
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
}

function BarChart({ data, maxValue, color = '#f97316', label }) {
    return (
        <div className="bar-chart">
            <div className="bar-chart-bars">
                {data.map((item, i) => {
                    const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    return (
                        <div key={i} className="bar-col">
                            <div className="bar-value-label">
                                {item.value > 0 ? item.value : ''}
                            </div>
                            <div className="bar-wrapper">
                                <div
                                    className="bar-fill"
                                    style={{
                                        height: `${height}%`,
                                        background: color,
                                        opacity: item.value > 0 ? 1 : 0.15
                                    }}
                                />
                            </div>
                            <div className="bar-label">{item.label}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function HistoryChart({ completedDays, onClose, embedded = false }) {
    const [tab, setTab] = useState('weeks');

    const trainedDates = getTrainedDates();

    // Treinos por semana do programa
    const weekData = useMemo(() => {
        return WEEK_NAMES.map((label, i) => {
            const week = i + 1;
            const count = [1, 2, 3].filter(d => completedDays.includes(`${week}-${d}`)).length;
            return { label, value: count };
        });
    }, [completedDays]);

    // Treinos por dia da semana (últimos 30 dias)
    const weekdayData = useMemo(() => {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        const cutoff = new Date(Date.now() - 30 * 86400000);
        trainedDates.forEach(dateStr => {
            const d = new Date(dateStr);
            if (d >= cutoff) counts[d.getDay()]++;
        });
        return DAY_NAMES.map((label, i) => ({ label, value: counts[i] }));
    }, [trainedDates]);

    // Stats gerais
    const totalWorkouts = completedDays.length;
    const totalWeeksActive = new Set(completedDays.map(d => d.split('-')[0])).size;
    const completedWeeks = WEEK_NAMES.filter((_, i) =>
        [1, 2, 3].every(d => completedDays.includes(`${i + 1}-${d}`))
    ).length;

    const bestDay = weekdayData.reduce((best, d) => d.value > best.value ? d : best, { value: 0 });

    return (
        <div className={embedded ? 'history-page' : 'history-overlay'} onClick={embedded ? undefined : onClose}>
            <div className={embedded ? '' : 'history-sheet'} onClick={e => e.stopPropagation()}>

                {embedded
                    ? <h2 className="history-page-title">📊 Histórico</h2>
                    : <><div className="history-handle" /><h2 className="history-title">📊 Histórico</h2></>
                }

                {/* Stats cards */}
                <div className="stats-row">
                    <div className="stats-mini-card">
                        <div className="stats-mini-value">{totalWorkouts}</div>
                        <div className="stats-mini-label">Treinos</div>
                    </div>
                    <div className="stats-mini-card">
                        <div className="stats-mini-value">{completedWeeks}</div>
                        <div className="stats-mini-label">Semanas completas</div>
                    </div>
                    <div className="stats-mini-card">
                        <div className="stats-mini-value">{totalWeeksActive}</div>
                        <div className="stats-mini-label">Semanas ativas</div>
                    </div>
                    <div className="stats-mini-card">
                        <div className="stats-mini-value">{bestDay.value > 0 ? bestDay.label : '—'}</div>
                        <div className="stats-mini-label">Dia favorito</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="history-tabs">
                    <button
                        className={`history-tab ${tab === 'weeks' ? 'active' : ''}`}
                        onClick={() => setTab('weeks')}
                    >
                        Por semana
                    </button>
                    <button
                        className={`history-tab ${tab === 'days' ? 'active' : ''}`}
                        onClick={() => setTab('days')}
                    >
                        Dia da semana
                    </button>
                </div>

                {tab === 'weeks' && (
                    <div className="chart-section">
                        <div className="chart-legend">Treinos concluídos por semana do programa</div>
                        <BarChart
                            data={weekData}
                            maxValue={3}
                            color="#f97316"
                        />
                        <div className="chart-footnote">Máximo: 3 treinos por semana</div>
                    </div>
                )}

                {tab === 'days' && (
                    <div className="chart-section">
                        <div className="chart-legend">Em quais dias você mais treina (últimos 30 dias)</div>
                        <BarChart
                            data={weekdayData}
                            maxValue={Math.max(...weekdayData.map(d => d.value), 1)}
                            color="#22c55e"
                        />
                        <div className="chart-footnote">
                            {bestDay.value > 0
                                ? `Você treina mais às ${bestDay.label}!`
                                : 'Complete treinos para ver seus padrões'}
                        </div>
                    </div>
                )}

                <button className="history-close" onClick={onClose}>
                    {embedded ? '← Voltar' : 'Fechar'}
                </button>
            </div>
        </div>
    );
}
