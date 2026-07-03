// ============================================================
// app.jsx — Componente raiz do BoraCorrer
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';

import Onboarding   from './components/onboarding.jsx';
import WeekPlan     from './components/weekplan.jsx';
import Timer        from './components/timer.jsx';
import ProfileSetup from './components/profilesetup.jsx';
import ModeSelect   from './components/modeselect.jsx';
import FreeRun      from './components/freelrun.jsx';
import InvitePage   from './components/invitepage.jsx';
import BottomNav    from './components/bottomnav.jsx';
import Calendar     from './components/calendar.jsx';
import HistoryChart from './components/historychart.jsx';
import SettingsPage from './components/settingspage.jsx';

import { getWeekPlan, TOTAL_WEEKS } from './data/plans.js';

import {
    syncUserToSheets,
    syncProgressToSheets,
    syncStreakDateToSheets,
    saveCompletedWorkout,
} from './services/api.js';

import {
    loadProgressFromCloud,
    saveProgressToCloud,
    saveWorkoutToCloud,
    saveUserProfile,
    saveDisplayName,
    savePublicProfile,
    savePreferencesToCloud,
    addTrainedDate,
} from './services/firestore.js';

import { useAuth }   from './hooks/useauth.js';
import { useStreak } from './hooks/usestreak.js';
import { useTheme }  from './hooks/usetheme.js';
import './app.css';

// ============================================================
// Roteamento simples por pathname
// ============================================================

function getRoute() {
    const path        = window.location.pathname;
    const inviteMatch = path.match(/^\/convite\/([^/]+)$/);
    if (inviteMatch) return { type: 'invite', uid: inviteMatch[1] };
    return { type: 'app' };
}

// ============================================================
// Cache local (localStorage) — apenas performance
// ============================================================

function getCacheKey(uid) { return `boracorrer-cache-${uid}`; }

function readCache(uid) {
    try {
        const raw = localStorage.getItem(getCacheKey(uid));
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function writeCache(uid, state) {
    try { localStorage.setItem(getCacheKey(uid), JSON.stringify(state)); }
    catch {}
}

function clearCache(uid) {
    try {
        localStorage.removeItem(getCacheKey(uid));
        localStorage.removeItem('boracorrer-dates');
        localStorage.removeItem('boracorrer-theme');
        localStorage.removeItem('boracorrer-voice');
        localStorage.removeItem('boracorrer-reminder');
    } catch {}
}

// ============================================================
// Hook: status de conexão
// ============================================================

function useOnlineStatus() {
    const [online, setOnline] = useState(navigator.onLine);

    useEffect(() => {
        const on  = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener('online',  on);
        window.addEventListener('offline', off);
        return () => {
            window.removeEventListener('online',  on);
            window.removeEventListener('offline', off);
        };
    }, []);

    return online;
}

// ============================================================
// App raiz
// ============================================================

export default function App() {
    const route = getRoute();

    if (route.type === 'invite') {
        return (
            <div className="app-shell">
                <InvitePage inviteUid={route.uid} />
            </div>
        );
    }

    return <MainApp />;
}

// ============================================================
// App principal (autenticado)
// ============================================================

function MainApp() {
    const { user, loading: authLoading, logout, updateUserProfile } = useAuth();
    const isOnline = useOnlineStatus();

    // ---- Hook de tema — aplica data-theme no <html> imediatamente ----
    const { themeMode, setMode: applyThemeMode } = useTheme();

    // ---- Estado principal ----
    const [currentWeek,    setCurrentWeek]    = useState(1);
    const [completedDays,  setCompletedDays]  = useState([]);
    const [userProfile,    setUserProfile]    = useState(null);
    const [currentPlanId,  setCurrentPlanId]  = useState('5k');
    const [trainedDates,   setTrainedDates]   = useState([]);

    // ---- Preferências ----
    const [voiceEnabled,     setVoiceEnabled]     = useState(
        () => localStorage.getItem('boracorrer-voice') !== 'false'
    );
    const [remindersEnabled, setRemindersEnabled] = useState(
        () => localStorage.getItem('boracorrer-reminder') === 'true'
    );

    // ---- Navegação ----
    const [activeDayKey,   setActiveDayKey]   = useState(null);
    const [freeWorkout,    setFreeWorkout]    = useState(null);
    const [showModeSelect, setShowModeSelect] = useState(false);
    const [showFreeRun,    setShowFreeRun]    = useState(null);
    const [activeTab,      setActiveTab]      = useState('home');
    const [view,           setView]           = useState('loading');

    const { streak, registerToday } = useStreak(completedDays, trainedDates);

    // ----------------------------------------------------------
    // Aplica estado carregado do Firestore/cache
    // ----------------------------------------------------------

    function applyState(state) {
        setCurrentWeek(state.currentWeek    ?? 1);
        setCompletedDays(state.completedDays  ?? []);
        setUserProfile(state.profile          ?? null);
        setCurrentPlanId(state.planId         ?? '5k');
        setTrainedDates(state.trainedDates    ?? []);

        // Preferências — aplica e sincroniza com localStorage
        if (state.theme) {
            applyThemeMode(state.theme);  // ← aplica no <html> imediatamente
        }
        if (typeof state.voiceEnabled === 'boolean') {
            setVoiceEnabled(state.voiceEnabled);
            localStorage.setItem('boracorrer-voice', String(state.voiceEnabled));
        }
        if (typeof state.remindersEnabled === 'boolean') {
            setRemindersEnabled(state.remindersEnabled);
            localStorage.setItem('boracorrer-reminder', String(state.remindersEnabled));
        }
    }

    // ----------------------------------------------------------
    // Carrega progresso ao autenticar
    // ----------------------------------------------------------

    useEffect(() => {
        if (authLoading) return;
        if (!user) { setView('onboarding'); return; }

        syncUserToSheets({
            uid:         user.uid,
            email:       user.email       || '',
            displayName: user.displayName || '',
        }).catch(() => {});

        if (user.displayName) {
            saveDisplayName(user.uid, user.displayName).catch(() => {});
        }

        async function loadProgress() {
            const cached = readCache(user.uid);
            if (cached) {
                applyState(cached);
                setView(cached.profile ? 'plan' : 'setup');
            } else {
                setView('loading');
            }

            const cloud = await loadProgressFromCloud(user.uid);
            if (cloud) {
                applyState(cloud);
                writeCache(user.uid, cloud);
                setView(cloud.profile ? 'plan' : 'setup');
            } else if (!cached) {
                setView('setup');
            }
        }

        loadProgress();
    }, [user, authLoading]);

    // ----------------------------------------------------------
    // Persiste progresso no Firestore sempre que o estado muda
    // ----------------------------------------------------------

    useEffect(() => {
        if (!user || ['loading', 'onboarding', 'setup'].includes(view)) return;

        const state = {
            currentWeek,
            completedDays,
            profile:          userProfile,
            planId:           currentPlanId,
            trainedDates,
            theme:            themeMode,
            voiceEnabled,
            remindersEnabled,
        };

        writeCache(user.uid, state);
        saveProgressToCloud(user.uid, state);

        savePublicProfile(user.uid, {
            displayName:   user.displayName || '',
            currentWeek,
            completedDays,
            planId:        currentPlanId,
        }).catch(() => {});

        syncProgressToSheets({
            uid:          user.uid,
            currentWeek,
            completedDays,
            planId:       currentPlanId,
            profile:      userProfile,
        }).catch(() => {});

    }, [user, currentWeek, completedDays, userProfile, currentPlanId,
        trainedDates, themeMode, voiceEnabled, remindersEnabled, view]);

    // ----------------------------------------------------------
    // Handler: salvar preferências
    // Tema usa useTheme.setMode para aplicar no <html> imediatamente.
    // ----------------------------------------------------------

    const handleSavePreference = useCallback((key, value) => {
        if (!user) return;

        if (key === 'theme') {
            applyThemeMode(value);  // ← aplica data-theme no <html> imediatamente
        }

        if (key === 'voiceEnabled') {
            setVoiceEnabled(value);
            localStorage.setItem('boracorrer-voice', String(value));
        }

        if (key === 'remindersEnabled') {
            setRemindersEnabled(value);
            localStorage.setItem('boracorrer-reminder', String(value));
        }

        // Persiste Firestore em background
        savePreferencesToCloud(user.uid, {
            theme:            key === 'theme'            ? value : themeMode,
            voiceEnabled:     key === 'voiceEnabled'     ? value : voiceEnabled,
            remindersEnabled: key === 'remindersEnabled' ? value : remindersEnabled,
        }).catch(() => {});

    }, [user, themeMode, voiceEnabled, remindersEnabled, applyThemeMode]);

    // ----------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------

    const handleProfileComplete = useCallback(async (profile) => {
        const initialState = {
            currentWeek:      1,
            completedDays:    [],
            profile,
            planId:           '5k',
            trainedDates:     [],
            theme:            themeMode,
            voiceEnabled,
            remindersEnabled,
        };

        setUserProfile(profile);
        setView('plan');

        if (user) {
            writeCache(user.uid, initialState);
            await Promise.all([
                saveUserProfile(user.uid, profile),
                saveProgressToCloud(user.uid, initialState),
            ]).catch(console.warn);
        }
    }, [user, themeMode, voiceEnabled, remindersEnabled]);

    const handleResetProfile = useCallback(() => {
        setUserProfile(null);
        setView('setup');
        setActiveTab('home');
    }, []);

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
            setCompletedDays(prev => {
                if (prev.includes(activeDayKey)) return prev;
                return [...prev, activeDayKey];
            });
        }

        const today = new Date().toISOString().slice(0, 10);
        registerToday();
        setTrainedDates(prev => {
            if (prev.includes(today)) return prev;
            return [...prev, today];
        });

        addTrainedDate(user.uid, today).catch(() => {});

        const [week, day] = activeDayKey ? activeDayKey.split('-') : [0, 0];

        const workoutData = {
            uid:             user.uid,
            userName:        user.displayName || user.email,
            week:            Number(week),
            day:             Number(day),
            planId:          currentPlanId,
            title:           freeWorkout?.title     || null,
            completedAt:     new Date().toISOString(),
            distanceKm:      stats?.distanceKm      || 0,
            durationSeconds: stats?.durationSeconds || 0,
            calories:        stats?.calories        || 0,
        };

        await saveWorkoutToCloud(user.uid, workoutData);
        saveCompletedWorkout(workoutData).catch(() => {});
        syncStreakDateToSheets({ uid: user.uid, date: today }).catch(() => {});

    }, [activeDayKey, user, registerToday, currentPlanId, freeWorkout]);

    const handleExitTimer = useCallback(() => {
        setActiveDayKey(null);
        setFreeWorkout(null);
        setView('plan');
    }, []);

    const handleLogout = useCallback(async () => {
        if (user) clearCache(user.uid);
        await logout();
    }, [user, logout]);

    // ----------------------------------------------------------
    // Render
    // ----------------------------------------------------------

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
                    completedDays={completedDays}
                    userProfile={userProfile}
                />
            </div>
        );
    }

    const weekPlan = getWeekPlan(currentWeek, currentPlanId);

    return (
        <div className="app-shell">

            {!isOnline && (
                <div className="offline-banner">
                    📵 Sem conexão — progresso salvo localmente
                </div>
            )}

            <div className="tab-content">

                {activeTab === 'home' && (
                    <WeekPlan
                        weekPlan={weekPlan}
                        completedDays={completedDays}
                        currentWeek={currentWeek}
                        totalWeeks={TOTAL_WEEKS}
                        currentPlanId={currentPlanId}
                        streak={streak}
                        onStartDay={handleStartDay}
                        onChangeWeek={setCurrentWeek}
                        onOpenModeSelect={() => setShowModeSelect(true)}
                        userName={user.displayName || user.email}
                        userUid={user.uid}
                        userProfile={userProfile}
                        user={user}
                        onUpdateName={updateUserProfile}
                    />
                )}

                {activeTab === 'calendar' && (
                    <div className="tab-page">
                        <Calendar
                            trainedDates={trainedDates}
                            onClose={() => setActiveTab('home')}
                            embedded
                        />
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="tab-page">
                        <HistoryChart
                            completedDays={completedDays}
                            trainedDates={trainedDates}
                            onClose={() => setActiveTab('home')}
                            embedded
                        />
                    </div>
                )}

                {activeTab === 'settings' && (
                    <SettingsPage
                        user={user}
                        userProfile={userProfile}
                        currentPlanId={currentPlanId}
                        completedDays={completedDays}
                        theme={themeMode}
                        voiceEnabled={voiceEnabled}
                        remindersEnabled={remindersEnabled}
                        onSavePreference={handleSavePreference}
                        onUpdateName={updateUserProfile}
                        onLogout={handleLogout}
                        onResetProfile={handleResetProfile}
                    />
                )}

            </div>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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
