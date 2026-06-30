import React, { useEffect, useRef } from 'react';
import { useRunTimer } from '../hooks/useRunTimer.js';
import { useGeoTracking } from '../hooks/useGeoTracking.js';
import RunMap from './runmap.jsx';
import './timer.css';

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDistance(distanceKm) {
    return distanceKm.toFixed(2).replace('.', ',');
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

        // Reativa o wake lock se o usuário voltar para a aba após minimizar
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

    const {
        route,
        distanceKm,
        error: geoError,
        startTracking,
        stopTracking,
        resetTracking
    } = useGeoTracking();

    // Mantém a tela ligada enquanto o treino está rodando
    useWakeLock(isRunning);

    useEffect(() => {
        if (isRunning) {
            startTracking();
        } else {
            stopTracking();
        }
    }, [isRunning, startTracking, stopTracking]);

    function handleReset() {
        reset();
        resetTracking();
    }

    if (isFinished) {
        return (
            <div className="timer-container timer-finished">
                <div className="finished-icon">🎉</div>
                <h2>Treino Concluído!</h2>
                <p>Parabéns, você completou o treino de hoje.</p>

                {route.length > 1 && (
                    <div className="finished-map-wrapper">
                        <RunMap route={route} />
                        <div className="finished-distance">
                            {formatDistance(distanceKm)} km percorridos
                        </div>
                    </div>
                )}

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

            {route.length > 0 && (
                <div className="live-map-wrapper">
                    <RunMap route={route} />
                    <div className="live-distance">{formatDistance(distanceKm)} km</div>
                </div>
            )}

            {geoError && <div className="geo-error">{geoError}</div>}

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
                <button className="btn-control btn-reset" onClick={handleReset}>
                    ↺ Reiniciar
                </button>
            </div>
        </div>
    );
}
