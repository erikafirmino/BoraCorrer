import React, { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/onboarding.jsx';
import WeekPlan from './components/weekplan.jsx';
import Timer from './components/timer.jsx';
import { getWeekPlan, TOTAL_WEEKS } from './data/plans.js';
import { saveCompletedWorkout } from './services/api.js';
import { useAuth } from './hooks/useauth.js';
import { useStreak } from './hooks/usestreak.js';
import './app.css';

function getUserStorageKey(uid) {
    return `boracorrer-state-${uid}`;
}

function loadUserState(uid) {
    try {
        const raw = localStorage.getItem(getUserStorageKey(uid));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveUserState(uid, state) {
    localStorage.setItem(getUserStorageKey(uid), JSON.stringify(state));
}

export default function App() {
    const { user, loading: authLoading, logout } = useAuth();

    const [currentWeek, setCurrentWeek] = useState(1);
    const [completedDays, setCompletedDays] = useState([]);
    const [activeDayKey, setActiveDayKey] = useState(null);
    const [view, setView] = useState('loading');

    const { registerToday } = useStreak(completedDays);

    // Carrega estado do usuário logado
    useEffect(() => {
        if (authLoading) return;

        if (user) {
            const saved = loadUserState(user.uid);
            setCurrentWeek(saved?.currentWeek || 1);
            setCompletedDays(saved?.completedDays || []);
            setView('plan');
        } else {
            setCurrentWeek(1);
            setCompletedDays([]);
            setView('onboarding');
        }
    }, [user, authLoading]);

    // Persiste estado do usuário
    useEffect(() => {
        if (!user || view === 'loading') return;
        saveUserState(user.uid, { currentWeek, completedDays });
    }, [user, currentWeek, completedDays, view]);

    const handleStartDay = useCallback((dayKey) => {
        setActiveDayKey(dayKey);
        setView('timer');
    }, []);

    const handleWorkoutComplete = useCallback(async () => {
        if (!activeDayKey || !user) return;

        setCompletedDays((prev) => {
            if (prev.includes(activeDayKey)) return prev;
            return [...prev, activeDayKey];
        });

        registerToday();

        const [week, day] = activeDayKey.split('-');

        await saveCompletedWorkout({
            userName: user.displayName || user.email,
            week: Number(week),
            day: Number(day),
            completedAt: new Date().toISOString()
        });
    }, [activeDayKey, user, registerToday]);

    const handleExitTimer = useCallback(() => {
        setActiveDayKey(null);
        setView('plan');
    }, []);

    if (authLoading || view === 'loading') {
        return (
            <div className="app-shell app-loading">
                <img src="/icons/192.png" alt="BoraCorrer" className="loading-logo" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="app-shell">
                <Onboarding onComplete={() => {}} />
            </div>
        );
    }

    if (view === 'timer' && activeDayKey) {
        const [week, day] = activeDayKey.split('-');
        const weekPlan = getWeekPlan(Number(week));

        return (
            <div className="app-shell">
                <Timer
                    workout={weekPlan.workout}
                    onWorkoutComplete={handleWorkoutComplete}
                    onExit={handleExitTimer}
                    weekNumber={Number(week)}
                    dayNumber={Number(day)}
                />
            </div>
        );
    }

    const weekPlan = getWeekPlan(currentWeek);

    return (
        <div className="app-shell">
            <WeekPlan
                weekPlan={weekPlan}
                completedDays={completedDays}
                currentWeek={currentWeek}
                totalWeeks={TOTAL_WEEKS}
                onStartDay={handleStartDay}
                onChangeWeek={setCurrentWeek}
                userName={user.displayName || user.email}
                onSwitchUser={logout}
            />
        </div>
    );
}
