// ============================================================
// usestreak.js
// Calcula o streak de dias consecutivos de treino.
// Usa trainedDates do Firestore (via prop) como fonte primária.
// Mantém localStorage como cache para cálculo offline.
// ============================================================

import { useMemo } from 'react';

/**
 * Calcula quantos dias consecutivos o usuário treinou até hoje.
 * @param {string[]} dates Array de strings "YYYY-MM-DD"
 * @returns {number} Número de dias consecutivos
 */
function calcStreak(dates) {
    if (!dates || dates.length === 0) return 0;

    const unique = [...new Set(dates)].sort().reverse();

    const today     = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Streak só conta se treinou hoje ou ontem
    if (unique[0] !== today && unique[0] !== yesterday) return 0;

    let count = 1;
    for (let i = 1; i < unique.length; i++) {
        const prev = new Date(unique[i - 1]);
        const curr = new Date(unique[i]);
        const diff = Math.round((prev - curr) / 86400000);
        if (diff === 1) {
            count++;
        } else {
            break;
        }
    }

    return count;
}

/**
 * Hook de streak.
 * @param {string[]} completedDays Dias concluídos no formato "semana-dia"
 * @param {string[]} trainedDates  Datas reais de treino vindas do Firestore
 * @returns {{ streak: number, registerToday: Function }}
 */
export function useStreak(completedDays, trainedDates = []) {
    // Usa trainedDates do Firestore se disponível,
    // senão cai para o localStorage (retrocompatibilidade)
    const dates = useMemo(() => {
        if (trainedDates && trainedDates.length > 0) return trainedDates;

        try {
            const saved = localStorage.getItem('boracorrer-dates');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }, [trainedDates]);

    const streak = useMemo(() => calcStreak(dates), [dates]);

    /**
     * Registra hoje como dia de treino no localStorage (cache local).
     * O Firestore é atualizado pelo app.jsx via addTrainedDate.
     */
    function registerToday() {
        const today = new Date().toISOString().slice(0, 10);
        try {
            const saved   = localStorage.getItem('boracorrer-dates');
            const current = saved ? JSON.parse(saved) : [];
            if (!current.includes(today)) {
                current.push(today);
                localStorage.setItem('boracorrer-dates', JSON.stringify(current));
            }
        } catch {}
    }

    return { streak, registerToday };
}
