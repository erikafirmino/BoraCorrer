import React, { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/onboarding.jsx';
import WeekPlan from './components/weekplan.jsx';
import Timer from './components/timer.jsx';
import { getWeekPlan, TOTAL_WEEKS } from './data/plans.js';
import { saveCompletedWorkout } from './services/api.js';
import { useStreak } from './hooks/usestreak.js';
import './app.css';

const STORAGE_KEY = 'boracorrer-state';
const ALL_USERS_KEY = 'boracorrer-users';

function loadState(userName) {
    try {
        const all = JSON.parse(localStorage.getItem(ALL_USERS_KEY) || '{}');
        return all[userName] || null;
    } catch {
        return null;
    }
}

function saveState(userName, state) {
    try {
        const all = JSON.parse(localStorage.getItem(ALL_USERS_KEY) || '{}');
        all[userName] = state;
        localStorage.setItem(ALL_USERS_KEY, JSON.stringify(all));
        // Salva o último usuário ativo
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastUser: userName }));
    } catch {}
}

function getLastUser() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw).lastUser || null;
    } catch {
        return null;
    }
}

export default function App() {
    const [userName, setUserName] = useState(null);
    const [currentWeek, setCurrentWeek] = useState(1);
    const [completedDays, setCompletedDays] = useState([]);
    const [activeDayKey, setActiveDayKey] = useState(null);
    const [view, setView] = useState('loading');

    const { registerToday } = useStreak(completedDays);

    // Carrega o último usuário ao iniciar
    useEffect(() => {
        const lastUser = getLastUser();
        if (lastUser) {
            const saved = loadState(lastUser);
            setUserName(lastUser);
            setCurrentWeek(saved?.currentWeek || 1);
            setCompletedDays(saved?.completedDays || []);
            setView('plan');
        } else {
            setView('onboarding');
        }
    }, []);

    // Persiste o estado do usuário atual
    useEffect(() => {
        if (view === 'loading' || !userName) return;
        saveState(userName, { currentWeek, completedDays });
    }, [userName, currentWeek, completedDays, view]);

    const handleOnboardingComplete = useCallback((name) => {
        const saved = loadState(name);
        setUserName(name);
        setCurrentWeek(saved?.currentWeek || 1);
        setCompletedDays(saved?.completedDays || []);
        setView('plan');
    }, []);

    // Troca de usuário sem apagar dados
    const handleSwitchUser = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setUserName(null);
        setCurrentWeek(1);
        setCompletedDays([]);
        setActiveDayKey(null);
        setView('onboarding');
    }, []);

    const handleStartDay = useCallback((dayKey) => {
        setActiveDayKey(dayKey);
        setView('timer');
    }, []);

    const handleWorkoutComplete = useCallback(async () => {
        if (!activeDayKey) return;

        setCompletedDays((prev) => {
            if (prev.includes(activeDayKey)) return prev;
            return [...prev, activeDayKey];
        });

        registerToday();

        const [week, day] = activeDayKey.split('-');

        await saveCompletedWorkout({
            userName,
            week: Number(week),
            day: Number(day),
            completedAt: new Date().toISOString()
        });
    }, [activeDayKey, userName, registerToday]);

    const handleExitTimer = useCallback(() => {
        setActiveDayKey(null);
        setView('plan');
    }, []);

    if (view === 'loading') {
        return <div className="app-shell" />;
    }

    if (view === 'onboarding') {
        return (
            <div className="app-shell">
                <Onboarding onComplete={handleOnboardingComplete} />
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
                userName={userName}
                onSwitchUser={handleSwitchUser}
            />
        </div>
    );
}
