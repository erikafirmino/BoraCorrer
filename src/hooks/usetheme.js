import { useState, useEffect } from 'react';

export function useTheme() {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('boracorrer-theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('boracorrer-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Escuta mudança automática do sistema operacional
    useEffect(() => {
        const saved = localStorage.getItem('boracorrer-theme');
        if (saved) return; // Usuário escolheu manualmente, não sobrescreve

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        function handleChange(e) {
            setIsDark(e.matches);
        }
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    function toggleTheme() {
        setIsDark((prev) => !prev);
    }

    return { isDark, toggleTheme };
}
