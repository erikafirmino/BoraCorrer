import React, { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/onboarding.jsx';
import WeekPlan from './components/weekplan.jsx';
import Timer from './components/timer.jsx';
import ProfileSetup from './components/profilesetup.jsx';
import ModeSelect from './components/modeselect.jsx';
import FreeRun from './components/freelrun.jsx';
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
        return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
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
    const [currentPlanId, setCurrentPlanId] = useState('5k');
    const [freeWorkout, setFreeWorkout] = useState(null); // { workout, title }
    const [showModeSelect, setShowModeSelect] = useState(false);
    const [showFreeRun, setShowFreeRun] = useState(null); // null | { workout?, title? }
    const [view, setView] = useState('loading');

    const { registerToday } = useStreak(completedDays);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { setView('onboarding'); return; }

        async function loadProgress() {
            const local = loadLocal(user.uid);
            if (local) {
                setCurrentWeek(local.currentWeek || 1);
                setCompletedDays(local.completedDays || []);
                setUserProfile(local.profile || null);
                setCurrentPlanId(local.planId || '5k');
                setView(local.profile ? 'plan' : 'setup');
            }

            const cloud = await loadProgressFromCloud(user.uid);
            if (cloud) {
                setCurrentWeek(cloud.currentWeek || 1);
                setCompletedDays(cloud.completedDays || []);
                setUserProfile(cloud.profile || null);
                setCurrentPlanId(cloud.planId || '5k');
                saveLocal(user.uid, cloud);
                setView(cloud.profile ? 'plan' : 'setup');
            } else if (!local) {
                setView('setup');
            }
        }

        loadProgress();
    }, [user, authLoading]);

    useEffect(() => {
        if (!user || ['loading', 'onboarding', 'setup'].includes(view)) return;
        const state = { currentWeek, completedDays, profile: userProfile, planId: currentPlanId };
        saveLocal(user.uid, state);
        if (isOnline) saveProgressToCloud(user.uid, state);
    }, [user, currentWeek, completedDays, userProfile, currentPlanId, view, isOnline]);

    const handleProfileComplete = useCallback(async (profile) => {
        setUserProfile(profile);
        setView('plan'); // Muda a view ANTES de salvar na nuvem
        if (user) {
            saveLocal(user.uid, {
                currentWeek: 1,
                completedDays: [],
                profile,
                planId: '5k'
            });
            saveUserProfile(user.uid, profile).catch(console.warn);
        }
    }, [user]);

    const handleStartDay = useCallback((dayKey) => {
        setActiveDayKey(dayKey);
        setFreeWorkout(null);
        setView('timer');
    }, []);

    const handleStartFreeWorkout = useCallback((workout, title) => {
        setShowModeSelect(false);
        setShowFreeRun(null);
        setFreeWorkout({ workout, title });
        setActiveDayKey(null);
        setView('timer');
    }, []);

    const handleSelectPlan = useCallback((planId) => {
        setCurrentPlanId(planId);
        setCurrentWeek(1);
        setShowModeSelect(false);
    }, []);

    const handleWorkoutComplete = useCallback(async (stats) => {
        if (!user) return;

        if (activeDayKey) {
            setCompletedDays((prev) => {
                if (prev.includes(activeDayKey)) return prev;
                return [...prev, activeDayKey];
            });
        }

        registerToday();

        const [week, day] = activeDayKey ? activeDayKey.split('-') : [0, 0];

        await saveWorkoutToCloud(user.uid, {
            week: Number(week),
            day: Number(day),
            planId: currentPlanId,
            title: freeWorkout?.title || null,
            completedAt: new Date().toISOString(),
            distanceKm: stats?.distanceKm || 0,
            durationSeconds: stats?.durationSeconds || 0
        });

        if (activeDayKey) {
            await saveCompletedWorkout({
                userName: user.displayName || user.email,
                week: Number(week),
                day: Number(day),
                completedAt: new Date().toISOString()
            });
        }
    }, [activeDayKey, user, registerToday, currentPlanId, freeWorkout]);

    const handleExitTimer = useCallback(() => {
        setActiveDayKey(null);
        setFreeWorkout(null);
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
        return <div className="app-shell"><Onboarding onComplete={() => {}} /></div>;
    }

    if (view === 'setup') {
        return <div className="app-shell"><ProfileSetup onComplete={handleProfileComplete} /></div>;
    }

    if (view === 'timer') {
        const workout = freeWorkout?.workout || (() => {
            const [week] = activeDayKey ? activeDayKey.split('-') : [1];
            return getWeekPlan(Number(week), currentPlanId).workout;
        })();

        const [week, day] = activeDayKey ? activeDayKey.split('-') : [0, 0];

        return (
            <div className="app-shell">
                <Timer
                    workout={workout}
                    onWorkoutComplete={handleWorkoutComplete}
                    onExit={handleExitTimer}
                    weekNumber={Number(week)}
                    dayNumber={Number(day)}
                    workoutTitle={freeWorkout?.title}
                />
            </div>
        );
    }

    const weekPlan = getWeekPlan(currentWeek, currentPlanId);

    return (
        <div className="app-shell">
            {!isOnline && (
                <div className="offline-banner">📵 Sem conexão — progresso salvo localmente</div>
            )}
            <WeekPlan
                weekPlan={weekPlan}
                completedDays={completedDays}
                currentWeek={currentWeek}
                totalWeeks={TOTAL_WEEKS}
                currentPlanId={currentPlanId}
                onStartDay={handleStartDay}
                onChangeWeek={setCurrentWeek}
                onOpenModeSelect={() => setShowModeSelect(true)}
                userName={user.displayName || user.email}
                onSwitchUser={logout}
                userProfile={userProfile}
                user={user}
                onUpdateName={updateUserProfile}
            />

            {showModeSelect && (
                <ModeSelect
                    currentPlanId={currentPlanId}
                    completedDays={completedDays}
                    onSelectPlan={handleSelectPlan}
                    onStartFreeWorkout={(workout, title) => {
                        if (workout) {
                            handleStartFreeWorkout(workout, title);
                        } else {
                            setShowModeSelect(false);
                            setShowFreeRun({ title });
                        }
                    }}
                    onClose={() => setShowModeSelect(false)}
                />
            )}

            {showFreeRun && (
                <FreeRun
                    title={showFreeRun.title}
                    onStart={handleStartFreeWorkout}
                    onClose={() => setShowFreeRun(null)}
                />
            )}
        </div>
    );
}
