import React, { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/onboarding.jsx';
import WeekPlan from './components/weekplan.jsx';
import Timer from './components/timer.jsx';
import ProfileSetup from './components/profilesetup.jsx';
import { getWeekPlan, TOTAL_WEEKS } from './data/plans.js';
import { saveCompletedWorkout } from './services/api.js';
import {
    loadProgressFromCloud,
    saveProgressToCloud,
    saveWorkoutToCloud,
    saveUserProfile
} from './services/firestore.js';
import { useAuth } from './hooks/useauth.js';
import { useStreak } from './hooks/usestreak.js';
import './app.css';

function getLocalKey(uid) { return `boracorrer-state-${uid}`; }
function loadLocal(uid) {
    try { return JSON.parse(localStorage.getItem(getLocalKey(uid))); } catch { return null; }
}
function saveLocal(uid, state) {
    localStorage.setItem(getLocalKey(uid), JSON.stringify(state));
}

function useOnlineStatus() {
    const [online, setOnline] = useState(navigator.onLine);
    useEffect(() => {
        const on = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
            window.removeEventListener('online', on);
            window.removeEventListener('offline', off);
        };
    }, []);
    return online;
}

export default function App() {
    const { user, loading: authLoading, logout, updateUserProfile } = useAuth();
    const isOnline = useOnlineStatus();

    const [currentWeek, setCurrentWeek] = useState(1);
    const [completedDays, setCompletedDays] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [activeDayKey, setActiveDayKey] = useState(null);
    const [view, setView] = useState('loading');

    const { registerToday } = useStreak(completedDays);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setView('onboarding');
            return;
        }

        async function loadProgress() {
            const cloud = await loadProgressFromCloud(user.uid);

            if (cloud) {
                setCurrentWeek(cloud.currentWeek || 1);
                setCompletedDays(cloud.completedDays || []);
                setUserProfile(cloud.profile || null);
                saveLocal(user.uid, cloud);
                setView(cloud.profile ? 'plan' : 'setup');
            } else {
                const local = loadLocal(user.uid);
                setCurrentWeek(local?.currentWeek || 1);
                setCompletedDays(local?.completedDays || []);
                setUserProfile(local?.profile || null);
                setView(local?.profile ? 'plan' : 'setup');
            }
        }

        loadProgress();
    }, [user, authLoading]);

    useEffect(() => {
        if (!user || ['loading', 'onboarding', 'setup'].includes(view)) return;

        const state = { currentWeek, completedDays, profile: userProfile };
        saveLocal(user.uid, state);

        if (isOnline) {
            saveProgressToCloud(user.uid, state);
        }
    }, [user, currentWeek, completedDays, userProfile, view, isOnline]);

    const handleProfileComplete = useCallback(async (profile) => {
        setUserProfile(profile);
        if (user) await saveUserProfile(user.uid, profile);
        setView('plan');
    }, [user]);

    const handleStartDay = useCallback((dayKey) => {
        setActiveDayKey(dayKey);
        setView('timer');
    }, []);

    const handleWorkoutComplete = useCallback(async (stats) => {
        if (!activeDayKey || !user) return;

        setCompletedDays((prev) => {
            if (prev.includes(activeDayKey)) return prev;
            return [...prev, activeDayKey];
        });

        registerToday();

        const [week, day] = activeDayKey.split('-');

        await saveWorkoutToCloud(user.uid, {
            week: Number(week),
            day: Number(day),
            completedAt: new Date().toISOString(),
            distanceKm: stats?.distanceKm || 0,
            durationSeconds: stats?.durationSeconds || 0
        });

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

    if (!user || view === 'onboarding') {
        return (
            <div className="app-shell">
                <Onboarding onComplete={() => {}} />
            </div>
        );
    }

    if (view === 'setup') {
        return (
            <div className="app-shell">
                <ProfileSetup onComplete={handleProfileComplete} />
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
            {!isOnline && (
                <div className="offline-banner">
                    📵 Sem conexão — progresso salvo localmente
                </div>
            )}
            <WeekPlan
                weekPlan={weekPlan}
                completedDays={completedDays}
                currentWeek={currentWeek}
                totalWeeks={TOTAL_WEEKS}
                onStartDay={handleStartDay}
                onChangeWeek={setCurrentWeek}
                userName={user.displayName || user.email}
                onSwitchUser={logout}
                userProfile={userProfile}
                user={user}
                onUpdateName={updateUserProfile}
            />
        </div>
    );
}
