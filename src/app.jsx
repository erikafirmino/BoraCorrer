import React, { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/onboarding.jsx';
import WeekPlan from './components/weekplan.jsx';
import Timer from './components/timer.jsx';
import { getWeekPlan, TOTAL_WEEKS } from './data/plans.js';
import { saveCompletedWorkout } from './services/api.js';
import { useStreak } from './hooks/usestreak.js';
import './app.css';

const STORAGE_KEY = 'boracorrer-state';

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function App() {
    const [userName, setUserName] = useState(null);
    const [currentWeek, setCurrentWeek] = useState(1);
    const [completedDays, setCompletedDays] = useState([]);
    const [activeDayKey, setActiveDayKey] = useState(null);
    const [view, setView] = useState('loading');

    const { registerToday } = useStreak(completedDays);

    useEffect(() => {
        const saved = loadState();
        if (saved && saved.userName) {
            setUserName(saved.userName);
            setCurrentWeek(saved.currentWeek || 1);
            setCompletedDays(saved.completedDays || []);
            setView('plan');
        } else {
            setView('onboarding');
        }
    }, []);

    useEffect(() => {
        if (view === 'loading') return;
        if (!userName) return;
        saveState({ userName, currentWeek, completedDays });
    }, [userName, currentWeek, completedDays, view]);

    const handleOnboardingComplete = useCallback((name) => {
        setUserName(name);
        setView('plan');
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
    }, [activeDayKey, userName]);

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
            />
        </div>
    );
}
