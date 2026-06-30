import { useState, useRef, useCallback, useEffect } from 'react';

const CANVAS_W = 320;
const CANVAS_H = 180;

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function usePictureInPicture() {
    const [isSupported] = useState(() => 'pictureInPictureEnabled' in document);
    const [isActive, setIsActive] = useState(false);

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const rafRef = useRef(null);
    const stateRef = useRef({
        secondsLeft: 0,
        blockType: 'walk',
        blockLabel: 'Caminhe',
        isRunning: false
    });

    // Desenha o frame atual no canvas
    function drawFrame() {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { secondsLeft, blockType, blockLabel, isRunning } = stateRef.current;

        const bgColor = blockType === 'run' ? '#14532d' : '#1e3a8a';
        const accentColor = blockType === 'run' ? '#22c55e' : '#60a5fa';

        // Fundo
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Gradiente sutil
        const gradient = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
        gradient.addColorStop(0, 'rgba(255,255,255,0.05)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Badge de status
        const badgeText = isRunning ? blockLabel.toUpperCase() : '⏸ PAUSADO';
        ctx.fillStyle = accentColor + '33';
        roundRect(ctx, 16, 16, 120, 28, 8);
        ctx.fill();
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 13px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(badgeText, 26, 34);

        // Ícone de app
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('🏃 BoraCorrer', CANVAS_W - 16, 34);

        // Cronômetro principal
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 72px Inter, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 12;
        ctx.fillText(formatTime(secondsLeft), CANVAS_W / 2, 128);
        ctx.shadowBlur = 0;

        // Borda inferior colorida
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, CANVAS_H - 4, CANVAS_W, 4);
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    // Loop de animação
    function startDrawLoop() {
        function loop() {
            drawFrame();
            rafRef.current = requestAnimationFrame(loop);
        }
        rafRef.current = requestAnimationFrame(loop);
    }

    function stopDrawLoop() {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }

    // Inicializa canvas e video ocultos
    useEffect(() => {
        if (!isSupported) return;

        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        canvasRef.current = canvas;

        const video = document.createElement('video');
        video.style.display = 'none';
        video.muted = true;
        video.autoplay = true;
        document.body.appendChild(video);

        const stream = canvas.captureStream(30);
        video.srcObject = stream;
        video.play().catch(() => {});
        videoRef.current = video;

        video.addEventListener('leavepictureinpicture', () => {
            setIsActive(false);
            stopDrawLoop();
        });

        return () => {
            stopDrawLoop();
            canvas.remove();
            video.remove();
        };
    }, [isSupported]);

    const enterPiP = useCallback(async () => {
        if (!isSupported || !videoRef.current) return;
        try {
            startDrawLoop();
            await videoRef.current.requestPictureInPicture();
            setIsActive(true);
        } catch (err) {
            console.warn('PiP não disponível:', err);
            stopDrawLoop();
        }
    }, [isSupported]);

    const exitPiP = useCallback(async () => {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        }
        stopDrawLoop();
        setIsActive(false);
    }, []);

    const updateState = useCallback((secondsLeft, blockType, blockLabel, isRunning) => {
        stateRef.current = { secondsLeft, blockType, blockLabel, isRunning };
    }, []);

    return {
        isSupported,
        isActive,
        enterPiP,
        exitPiP,
        updateState
    };
}
