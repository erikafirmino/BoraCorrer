// ============================================================
// usetheme.js
// Gerencia o tema claro/escuro/automático do BoraCorrer.
// Aplica data-theme no <html> ao mudar.
// ============================================================

import { useState, useEffect } from 'react';

function shouldBeDark(mode) {
    if (mode === 'dark')  return true;
    if (mode === 'light') return false;
    // Modo auto: escuro das 19h às 6h
    const hour = new Date().getHours();
    return hour < 6 || hour >= 19;
}

function applyTheme(mode) {
    const dark = shouldBeDark(mode);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    return dark;
}

export function useTheme() {
    const [themeMode, setThemeMode] = useState(
        () => localStorage.getItem('boracorrer-theme') || 'auto'
    );
    const [isDark, setIsDark] = useState(() => {
        const mode = localStorage.getItem('boracorrer-theme') || 'auto';
        return applyTheme(mode);
    });

    // Atualiza automaticamente a cada minuto no modo auto
    useEffect(() => {
        if (themeMode !== 'auto') return;
        const interval = setInterval(() => {
            setIsDark(applyTheme('auto'));
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, [themeMode]);

    // Escuta mudanças do sistema no modo auto
    useEffect(() => {
        if (themeMode !== 'auto') return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setIsDark(applyTheme('auto'));
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, [themeMode]);

    /**
     * Define o modo do tema e aplica imediatamente.
     * @param {'auto' | 'dark' | 'light'} mode
     */
    function setMode(mode) {
        localStorage.setItem('boracorrer-theme', mode);
        setThemeMode(mode);
        setIsDark(applyTheme(mode));
    }

    function toggleTheme() {
        const next = themeMode === 'auto' ? 'dark'
                   : themeMode === 'dark' ? 'light'
                   : 'auto';
        setMode(next);
    }

    const themeIcon  = themeMode === 'auto' ? '🌓' : themeMode === 'dark' ? '🌙' : '☀️';
    const themeLabel = themeMode === 'auto' ? 'Automático' : themeMode === 'dark' ? 'Escuro' : 'Claro';

    return { isDark, themeMode, themeIcon, themeLabel, toggleTheme, setMode };
}
