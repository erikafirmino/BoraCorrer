import React, { useEffect, useRef } from 'react';
import { useRunTimer } from '../hooks/useRunTimer.js';
import { useGeoTracking } from '../hooks/usegeotracking.js';
import RunMap from './runmap.jsx';
import Summary from './summary.jsx';
import './timer.css';

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDistance(distanceKm) {
    return distanceKm.toFixed(2).replace('.', ',');
}

function formatBlockDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (s === 0) return `${m} min`;
    return `${m}m${s}s`;
}

function useWakeLock(isActive) {
    const wakeLockRef = useRef(null);

    useEffect(() => {
        if (!('wakeLock' in navigator)) return;

        async function requestWakeLock() {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.warn('Wake Lock não disponível:', err);
            }
        }

        async function releaseWakeLock() {
            if (wakeLockRef.current) {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        }

        if (isActive) {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }

        function handleVisibilityChange() {
            if (document.visibilityState === 'visible' && isActive) {
                requestWakeLock();
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            releaseWakeLock();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isActive]);
}

// Tela de contagem regressiva 3-2-1
function CountdownOverlay({ count }) {
    return (
        <div className="countdown-overlay">
            <div className="countdown-number" key={count}>
                {count}
            </div>
            <div className="countdown-label">Prepare-se!</div>
        </div>
    );
}

// Painel de pausa mostrando próximo bloco
function PausedPanel({ currentBlock, nextBlock, onResume, onReset, onExit }) {
    const nextLabel = nextBlock
        ? nextBlock.type === 'run'
            ? nextBlock.label === 'Aquecimento' ? 'Aquecimento' : 'Corrida'
            : nextBlock.label === 'Desaquecimento' ? 'Desaquecimento' : 'Caminhada'
        : null;

    return (
        <div className="paused-panel">
            <div className="paused-title">⏸ Pausado</div>

            {nextBlock && (
                <div className="next-block-info">
                    <div className="next-block-label">Próximo bloco</div>
                    <div className={`next-block-type ${nextBlock.type}`}>
                        {nextLabel}
                    </div>
                    <div className="next-block-duration">
                        {formatBlockDuration(nextBlock.seconds)}
                    </div>
                </div>
            )}

            <div className="paused-actions">
                <button className="btn-resume" onClick={onResume}>
                    ▶ Continuar
                </button>
                <button className="btn-control btn-reset" onClick={onReset}>
                    ↺ Reiniciar
                </button>
                <button className="btn-exit-paused" onClick={onExit}>
                    Sair do treino
                </button>
            </div>
        </div>
    );
}

export default function Timer({ workout, onWorkoutComplete, onExit, weekNumber, dayNumber }) {
    const {
        currentBlock,
        nextBlock,
        secondsLeft,
        isRunning,
        isFinished,
        progressPercent,
        elapsedSeconds,
        countdown,
        isCountingDown,
        start,
        pause,
        reset
    } = useRunTimer(workout, onWorkoutComplete);

    const {
        route,
        distanceKm,
        error: geoError,
        startTracking,
        stopTracking,
        resetTracking
    } = useGeoTracking();

    const [isPaused, setIsPaused] = React.useState(false);

    useWakeLock(isRunning);

    useEffect(() => {
        if (isRunning) {
            startTracking();
            setIsPaused(false);
        } else if (!countdown) {
            stopTracking();
        }
    }, [isRunning, countdown, startTracking, stopTracking]);

    function handlePause() {
        pause();
        setIsPaused(true);
    }

    function handleResume() {
        setIsPaused(false);
        start();
    }

    function handleReset() {
        reset();
        resetTracking();
        setIsPaused(false);
    }

    if (isFinished) {
        return (
            <Summary
                totalSeconds={elapsedSeconds}
                distanceKm={distanceKm}
                route={route}
                weekNumber={weekNumber}
                dayNumber={dayNumber}
                onExit={onExit}
            />
        );
    }

    const blockTypeLabel = currentBlock?.type === 'run' ? 'CORRA' : 'CAMINHE';
    const blockColorClass = currentBlock?.type === 'run' ? 'run-mode' : 'walk-mode';

    // Tela de pausa
    if (isPaused) {
        return (
            <div className={`timer-container ${blockColorClass}`}>
                <PausedPanel
                    currentBlock={currentBlock}
                    nextBlock={nextBlock}
                    onResume={handleResume}
                    onReset={handleReset}
                    onExit={onExit}
                />
            </div>
        );
    }

    return (
        <div className={`timer-container ${blockColorClass}`}>

            {/* Overlay de contagem regressiva */}
            {countdown !== null && <CountdownOverlay count={countdown} />}

            <button className="btn-exit" onClick={onExit}>✕</button>

            <div className="block-label">{currentBlock?.label || blockTypeLabel}</div>

            <div className="block-type">{blockTypeLabel}</div>

            <div className={`time-display ${isCountingDown ? 'time-urgent' : ''}`}>
                {formatTime(secondsLeft)}
            </div>

            {route.length > 0 && (
                <div className="live-map-wrapper">
                    <RunMap route={route} />
                    <div className="live-distance">{formatDistance(distanceKm)} km</div>
                </div>
            )}

            {geoError && <div className="geo-error">{geoError}</div>}

            {/* Próximo bloco (visível sempre) */}
            {nextBlock && (
                <div className="next-block-pill">
                    Próximo: {nextBlock.type === 'run' ? '🏃 Corrida' : '🚶 Caminhada'} · {formatBlockDuration(nextBlock.seconds)}
                </div>
            )}

            <div className="progress-bar-wrapper">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="controls">
                {!isRunning && countdown === null ? (
                    <button className="btn-control btn-start" onClick={start}>
                        ▶ Iniciar
                    </button>
                ) : (
                    <button className="btn-control btn-pause" onClick={handlePause}>
                        ⏸ Pausar
                    </button>
                )}
                <button className="btn-control btn-reset" onClick={handleReset}>
                    ↺
                </button>
            </div>
        </div>
    );
}
