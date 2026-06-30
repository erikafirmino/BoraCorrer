import { useState, useRef, useCallback, useEffect } from 'react';

function playBeep(frequency = 880, duration = 250) {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration / 1000);

        setTimeout(() => ctx.close(), duration + 100);
    } catch (err) {
        console.warn('Áudio não suportado neste dispositivo.', err);
    }
}

function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

function notifyTransition(blockType) {
    if (blockType === 'run') {
        playBeep(1000, 300);
        vibrate([200, 100, 200]);
    } else {
        playBeep(500, 300);
        vibrate([400]);
    }
}

export function useRunTimer(workout, onComplete) {
    const [blockIndex, setBlockIndex] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(workout[0]?.seconds || 0);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const intervalRef = useRef(null);
    const hasNotifiedRef = useRef(false);

    const currentBlock = workout[blockIndex];

    const reset = useCallback(() => {
        setBlockIndex(0);
        setSecondsLeft(workout[0]?.seconds || 0);
        setIsRunning(false);
        setIsFinished(false);
        hasNotifiedRef.current = false;
    }, [workout]);

    const start = useCallback(() => {
        if (!hasNotifiedRef.current) {
            notifyTransition(workout[0]?.type);
            hasNotifiedRef.current = true;
        }
        setIsRunning(true);
    }, [workout]);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    useEffect(() => {
        if (!isRunning) {
            clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            setSecondsLeft((prevSeconds) => {
                if (prevSeconds <= 1) {
                    setBlockIndex((prevIndex) => {
                        const nextIndex = prevIndex + 1;

                        if (nextIndex >= workout.length) {
                            setIsRunning(false);
                            setIsFinished(true);
                            playBeep(1200, 500);
                            vibrate([300, 100, 300, 100, 300]);
                            if (onComplete) onComplete();
                            return prevIndex;
                        }

                        notifyTransition(workout[nextIndex].type);
                        setSecondsLeft(workout[nextIndex].seconds);
                        return nextIndex;
                    });
                    return prevSeconds;
                }
                return prevSeconds - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [isRunning, workout, onComplete]);

    const totalElapsedSeconds = workout
        .slice(0, blockIndex)
        .reduce((acc, b) => acc + b.seconds, 0) + ((currentBlock?.seconds || 0) - secondsLeft);

    const totalSeconds = workout.reduce((acc, b) => acc + b.seconds, 0);
    const progressPercent = totalSeconds > 0 ? (totalElapsedSeconds / totalSeconds) * 100 : 0;

    return {
        currentBlock,
        blockIndex,
        secondsLeft,
        isRunning,
        isFinished,
        progressPercent,
        start,
        pause,
        reset
    };
}
