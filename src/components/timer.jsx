import React from 'react';
import { useRunTimer } from '../hooks/useRunTimer.js';
import './Timer.css';

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function Timer({ workout, onWorkoutComplete, onExit }) {
    const {
        currentBlock,
        secondsLeft,
        isRunning,
        isFinished,
        progressPercent,
        start,
        pause,
        reset
    } = useRunTimer(workout, onWorkoutComplete);

    if (isFinished) {
        return (
            <div className="timer-container timer-finished">
                <div className="finished-icon">🎉</div>
                <h2>Treino Concluído!</h2>
                <p>Parabéns, você completou o treino de hoje.</p>
                <button className="btn-primary" onClick={onExit}>
                    Voltar para a rotina
                </button>
            </div>
        );
    }

    const blockTypeLabel = currentBlock?.type === 'run' ? 'CORRA' : 'CAMINHE';
    const blockColorClass = currentBlock?.type === 'run' ? 'run-mode' : 'walk-mode';

    return (
        <div className={`timer-container ${blockColorClass}`}>
            <button className="btn-exit" onClick={onExit}>
                ✕
            </button>

            <div className="block-label">{currentBlock?.label || blockTypeLabel}</div>

            <div className="block-type">{blockTypeLabel}</div>

            <div className="time-display">{formatTime(secondsLeft)}</div>

            <div className="progress-bar-wrapper">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="controls">
                {!isRunning ? (
                    <button className="btn-control btn-start" onClick={start}>
                        ▶ Iniciar
                    </button>
                ) : (
                    <button className="btn-control btn-pause" onClick={pause}>
                        ⏸ Pausar
                    </button>
                )}
                <button className="btn-control btn-reset" onClick={reset}>
                    ↺ Reiniciar
                </button>
            </div>
        </div>
    );
}
