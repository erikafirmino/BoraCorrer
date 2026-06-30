import { useMemo } from 'react';

export function useStreak(completedDays) {
    const streak = useMemo(() => {
        if (!completedDays || completedDays.length === 0) return 0;

        const saved = localStorage.getItem('boracorrer-dates');
        if (!saved) return 0;

        const dates = JSON.parse(saved);
        if (!dates || dates.length === 0) return 0;

        const unique = [...new Set(dates)].sort().reverse();
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        if (unique[0] !== today && unique[0] !== yesterday) return 0;

        let count = 1;
        for (let i = 1; i < unique.length; i++) {
            const prev = new Date(unique[i - 1]);
            const curr = new Date(unique[i]);
            const diffDays = Math.round((prev - curr) / 86400000);
            if (diffDays === 1) {
                count++;
            } else {
                break;
            }
        }

        return count;
    }, [completedDays]);

    function registerToday() {
        const today = new Date().toISOString().slice(0, 10);
        const saved = localStorage.getItem('boracorrer-dates');
        const dates = saved ? JSON.parse(saved) : [];
        if (!dates.includes(today)) {
            dates.push(today);
            localStorage.setItem('boracorrer-dates', JSON.stringify(dates));
        }
    }

    return { streak, registerToday };
}
