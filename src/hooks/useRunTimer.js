import { useState, useRef, useCallback, useEffect } from 'react';

function playBeep(frequency = 880, duration = 250, volume = 0.3) {
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
        gainNode.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01);
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

function speak(text) {
    try {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    } catch (err) {
        console.warn('Web Speech API não suportada:', err);
    }
}

function notifyTransition(blockType, label) {
    if (blockType === 'run') {
        playBeep(1000, 300);
        vibrate([200, 100, 200]);
        speak(label === 'Aquecimento' ? 'Hora de aquecer!' : 'Hora de correr!');
    } else if (label === 'Desaquecimento') {
        playBeep(500, 300);
        vibrate([400]);
        speak('Hora do desaquecimento!');
    } else {
        playBeep(500, 300);
        vibrate([400]);
        speak('Hora de caminhar!');
    }
}

// Bipe de contagem regressiva (mais suave)
function playCountdownBeep(isLast) {
    playBeep(isLast ? 1200 : 800, isLast ? 400 : 150, isLast ? 0.4 : 0.15);
    if (isLast) vibrate([100]);
}

export function useRunTimer(workout, onComplete) {
    const [blockIndex, setBlockIndex] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(workout[0]?.seconds || 0);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [countdown, setCountdown] = useState(null); // 3, 2, 1 ou null

    const intervalRef = useRef(null);
    const countdownRef = useRef(null);
    const hasNotifiedRef = useRef(false);

    const currentBlock = workout[blockIndex];
    const nextBlock = workout[blockIndex + 1] || null;

    const reset = useCallback(() => {
        clearInterval(intervalRef.current);
        clearInterval(countdownRef.current);
        setBlockIndex(0);
        setSecondsLeft(workout[0]?.seconds || 0);
        setIsRunning(false);
        setIsFinished(false);
        setElapsedSeconds(0);
        setCountdown(null);
        hasNotifiedRef.current = false;
    }, [workout]);

    // Contagem regressiva 3-2-1 antes de iniciar
    const start = useCallback(() => {
        if (hasNotifiedRef.current) {
            setIsRunning(true);
            return;
        }

        // Inicia contagem 3-2-1
        setCountdown(3);
        playBeep(600, 150, 0.15);

        let count = 3;
        countdownRef.current = setInterval(() => {
            count -= 1;
            if (count > 0) {
                setCountdown(count);
                playBeep(600, 150, 0.15);
            } else {
                clearInterval(countdownRef.current);
                setCountdown(null);
                notifyTransition(workout[0]?.type, workout[0]?.label);
                hasNotifiedRef.current = true;
                setIsRunning(true);
            }
        }, 1000);
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
            setElapsedSeconds((prev) => prev + 1);

            setSecondsLeft((prevSeconds) => {
                // Bipes nos últimos 5 segundos antes de trocar de bloco
                if (prevSeconds <= 5 && prevSeconds > 1) {
                    playCountdownBeep(false);
                }

                if (prevSeconds <= 1) {
                    setBlockIndex((prevIndex) => {
                        const nextIndex = prevIndex + 1;

                        if (nextIndex >= workout.length) {
                            setIsRunning(false);
                            setIsFinished(true);
                            playBeep(1200, 600, 0.4);
                            vibrate([300, 100, 300, 100, 300]);
                            speak('Treino concluído! Parabéns!');
                            if (onComplete) onComplete();
                            return prevIndex;
                        }

                        // Bipe final antes de trocar
                        playCountdownBeep(true);
                        setTimeout(() => {
                            notifyTransition(workout[nextIndex].type, workout[nextIndex].label);
                        }, 500);

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

    // Determina se está nos últimos 5 segundos do bloco
    const isCountingDown = secondsLeft <= 5 && isRunning;

    return {
        currentBlock,
        nextBlock,
        blockIndex,
        secondsLeft,
        isRunning,
        isFinished,
        progressPercent,
        elapsedSeconds,
        totalSeconds,
        countdown,
        isCountingDown,
        start,
        pause,
        reset
    };
}
