import { useState, useEffect } from 'react';

function shouldBeDark() {
    const saved = localStorage.getItem('boracorrer-theme');

    // Se usuário escolheu 'auto', usa horário
    if (saved === 'auto' || !saved) {
        const hour = new Date().getHours();
        return hour < 6 || hour >= 19; // Escuro: 19h até 6h
    }

    return saved === 'dark';
}

export function useTheme() {
    const [isDark, setIsDark] = useState(shouldBeDark);
    const [themeMode, setThemeMode] = useState(
        () => localStorage.getItem('boracorrer-theme') || 'auto'
    );

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Atualiza automaticamente a cada minuto quando em modo 'auto'
    useEffect(() => {
        if (themeMode !== 'auto') return;

        const interval = setInterval(() => {
            setIsDark(shouldBeDark());
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, [themeMode]);

    // Escuta mudança do sistema quando em modo 'auto'
    useEffect(() => {
        if (themeMode !== 'auto') return;

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        function handleChange() { setIsDark(shouldBeDark()); }
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, [themeMode]);

    function setMode(mode) {
        // mode: 'dark' | 'light' | 'auto'
        localStorage.setItem('boracorrer-theme', mode);
        setThemeMode(mode);
        if (mode === 'auto') {
            setIsDark(shouldBeDark());
        } else {
            setIsDark(mode === 'dark');
        }
    }

    function toggleTheme() {
        // Cicla entre: auto → dark → light → auto
        const next = themeMode === 'auto' ? 'dark' : themeMode === 'dark' ? 'light' : 'auto';
        setMode(next);
    }

    const themeIcon = themeMode === 'auto' ? '🌓' : themeMode === 'dark' ? '🌙' : '☀️';
    const themeLabel = themeMode === 'auto' ? 'Auto' : themeMode === 'dark' ? 'Escuro' : 'Claro';

    return { isDark, themeMode, themeIcon, themeLabel, toggleTheme, setMode };
}
