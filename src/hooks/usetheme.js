// ============================================================
// usetheme.js
// Gerencia o tema claro/escuro/automático do BoraCorrer.
// Persiste no Firestore (fonte primária) + localStorage (cache).
// ============================================================

import { useState, useEffect } from 'react';

function shouldBeDark(mode) {
    if (mode === 'dark')  return true;
    if (mode === 'light') return false;

    // Modo auto: escuro das 19h às 6h
    const hour = new Date().getHours();
    return hour < 6 || hour >= 19;
}

export function useTheme() {
    const [themeMode, setThemeMode] = useState(
        () => localStorage.getItem('boracorrer-theme') || 'auto'
    );
    const [isDark, setIsDark] = useState(
        () => shouldBeDark(localStorage.getItem('boracorrer-theme') || 'auto')
    );

    // Aplica o atributo data-theme no <html>
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Atualiza automaticamente a cada minuto no modo auto
    useEffect(() => {
        if (themeMode !== 'auto') return;

        const interval = setInterval(() => {
            setIsDark(shouldBeDark('auto'));
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, [themeMode]);

    // Escuta mudanças do sistema no modo auto
    useEffect(() => {
        if (themeMode !== 'auto') return;

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setIsDark(shouldBeDark('auto'));
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, [themeMode]);

    /**
     * Define o modo do tema.
     * @param {'auto' | 'dark' | 'light'} mode
     * @param {Function} [onSave] callback opcional para persistir no Firestore
     */
    function setMode(mode, onSave) {
        localStorage.setItem('boracorrer-theme', mode);
        setThemeMode(mode);
        setIsDark(shouldBeDark(mode));
        if (onSave) onSave(mode);
    }

    function toggleTheme(onSave) {
        const next = themeMode === 'auto' ? 'dark'
                   : themeMode === 'dark' ? 'light'
                   : 'auto';
        setMode(next, onSave);
    }

    const themeIcon  = themeMode === 'auto' ? '🌓' : themeMode === 'dark' ? '🌙' : '☀️';
    const themeLabel = themeMode === 'auto' ? 'Automático' : themeMode === 'dark' ? 'Escuro' : 'Claro';

    return { isDark, themeMode, themeIcon, themeLabel, toggleTheme, setMode };
}
