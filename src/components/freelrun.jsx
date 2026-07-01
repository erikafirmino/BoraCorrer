import React, { useState } from 'react';
import './freelrun.css';

const DURATIONS = [15, 20, 25, 30, 35, 40, 45, 60];

export default function FreeRun({ title, onStart, onClose }) {
    const [minutes, setMinutes] = useState(30);

    function buildWorkout(minutes) {
        return [
            { type: 'walk', seconds: 300, label: 'Aquecimento' },
            { type: 'run', seconds: (minutes - 10) * 60, label: title || 'Corrida Livre' },
            { type: 'walk', seconds: 300, label: 'Desaquecimento' }
        ];
    }

    return (
        <div className="freerun-overlay" onClick={onClose}>
            <div className="freerun-sheet" onClick={e => e.stopPropagation()}>
                <div className="freerun-handle" />

                <div className="freerun-emoji">🎯</div>
                <h2 className="freerun-title">{title || 'Corrida Livre'}</h2>
                <p className="freerun-desc">Escolha quanto tempo quer correr hoje</p>

                <div className="duration-grid">
                    {DURATIONS.map(d => (
                        <button
                            key={d}
                            className={`duration-btn ${minutes === d ? 'selected' : ''}`}
                            onClick={() => setMinutes(d)}
                        >
                            {d} min
                        </button>
                    ))}
                </div>

                <div className="freerun-info">
                    <div className="freerun-info-item">
                        <div className="freerun-info-value">5 min</div>
                        <div className="freerun-info-label">Aquecimento</div>
                    </div>
                    <div className="freerun-info-sep">+</div>
                    <div className="freerun-info-item">
                        <div className="freerun-info-value">{minutes - 10} min</div>
                        <div className="freerun-info-label">Corrida</div>
                    </div>
                    <div className="freerun-info-sep">+</div>
                    <div className="freerun-info-item">
                        <div className="freerun-info-value">5 min</div>
                        <div className="freerun-info-label">Desaquecimento</div>
                    </div>
                </div>

                <button
                    className="freerun-start"
                    onClick={() => onStart(buildWorkout(minutes), title || 'Corrida Livre')}
                >
                    ▶ Iniciar {minutes} minutos
                </button>

                <button className="freerun-cancel" onClick={onClose}>Cancelar</button>
            </div>
        </div>
    );
}
