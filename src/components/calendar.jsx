import React, { useState } from 'react';
import './calendar.css';

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getTrainedDates() {
    try {
        const saved = localStorage.getItem('boracorrer-dates');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export default function Calendar({ onClose }) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const trainedDates = new Set(getTrainedDates());

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const todayStr = today.toISOString().slice(0, 10);

    function prevMonth() {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    }

    function nextMonth() {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    }

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="calendar-overlay">
            <div className="calendar-sheet">
                <div className="calendar-header">
                    <button className="cal-nav" onClick={prevMonth}>‹</button>
                    <span className="cal-title">{MONTH_NAMES[month]} {year}</span>
                    <button className="cal-nav" onClick={nextMonth}>›</button>
                </div>

                <div className="cal-day-names">
                    {DAY_NAMES.map(d => (
                        <div key={d} className="cal-day-name">{d}</div>
                    ))}
                </div>

                <div className="cal-grid">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="cal-cell empty" />;

                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isTrained = trainedDates.has(dateStr);
                        const isToday = dateStr === todayStr;

                        return (
                            <div
                                key={dateStr}
                                className={`cal-cell ${isTrained ? 'trained' : ''} ${isToday ? 'today' : ''}`}
                            >
                                <span>{day}</span>
                                {isTrained && <div className="cal-dot" />}
                            </div>
                        );
                    })}
                </div>

                <div className="cal-legend">
                    <div className="cal-legend-item">
                        <div className="cal-dot" /> Treino realizado
                    </div>
                </div>

                <button className="cal-close" onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
}
