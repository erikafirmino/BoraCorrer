// ============================================================
// app.jsx
// Componente raiz do BoraCorrer.
//
// Estratégia de dados:
//   - Firestore é a FONTE PRIMÁRIA (dados persistem após limpar cache)
//   - localStorage é apenas CACHE de performance (dados offline/rápidos)
//   - Ao logar: busca Firestore em background enquanto mostra loading
//   - Ao salvar: persiste sempre no Firestore + atualiza cache local
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import Onboarding    from './components/onboarding.jsx';
import WeekPlan      from './components/weekplan.jsx';
import Timer         from './components/timer.jsx';
import ProfileSetup  from './components/profilesetup.jsx';
import ModeSelect    from './components/modeselect.jsx';
import FreeRun       from './components/freelrun.jsx';
import { getWeekPlan, TOTAL_WEEKS }    from './data/plans.js';
import { saveCompletedWorkout }        from './services/api.js';
import {
    loadProgressFromCloud,
    saveProgressToCloud,
    saveWorkoutToCloud,
    saveUserProfile
} from './services/firestore.js';
import { useAuth }   from './hooks/useauth.js';
import { useStreak } from './hooks/usestreak.js';
import './app.css';

// ============================================================
// Helpers de cache local (localStorage)
// ============================================================

function getCacheKey(uid) {
    return `boracorrer-cache-${uid}`;
}

function readCache(uid) {
    try {
        const raw = localStorage.getItem(getCacheKey(uid));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeCache(uid, state) {
    try {
        localStorage.setItem(getCacheKey(uid), JSON.stringify(state));
    } catch {
        // localStorage indisponível (modo privado, storage cheio) — ignora silenciosamente
    }
}

function clearCache(uid) {
    try {
        localStorage.removeItem(getCacheKey(uid));
    } catch {}
}

// ============================================================
// Hook: status de conexão
// ============================================================

function useOnlineStatus() {
    const [online, setOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline  = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener('online',  handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online',  handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return online;
}

// ============================================================
// App
// ============================================================

export default function App() {
    const { user, loading: authLoading, logout, updateUserProfile } = useAuth();
    const isOnline = useOnlineStatus();

    const [currentWeek,    setCurrentWeek]    = useState(1);
    const [completedDays,  setCompletedDays]  = useState([]);
    const [userProfile,    setUserProfile]    = useState(null);
    const [currentPlanId,  setCurrentPlanId]  = useState('5k');
    const [activeDayKey,   setActiveDayKey]   = useState(null);
    const [freeWorkout,    setFreeWorkout]    = useState(null);
    const [showModeSelect, setShowModeSelect] = useState(false);
    const [showFreeRun,    setShowFreeRun]    = useState(null);

    // 'loading' → 'onboarding' | 'setup' | 'plan' | 'timer'
    const [view, setView] = useState('loading');

    const { registerToday } = useStreak(completedDays);

    // ----------------------------------------------------------
    // Carrega o progresso do usuário ao autenticar
    // ----------------------------------------------------------
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setView('onboarding');
            return;
        }

        async function loadProgress() {
            // 1. Tenta o cache local para resposta imediata
            const cached = readCache(user.uid);

            if (cached) {
                applyState(cached);
                setView(cached.profile ? 'plan' : 'setup');
            } else {
                // Sem cache: mantém 'loading' até o Firestore responder
                setView('loading');
            }

            // 2. Sempre busca o Firestore (fonte primária)
            //    — sobrescreve o cache se os dados da nuvem forem mais recentes
            const cloud = await loadProgressFromCloud(user.uid);

            if (cloud) {
                applyState(cloud);
                writeCache(user.uid, cloud); // atualiza o cache com dados da nuvem
                setView(cloud.profile ? 'plan' : 'setup');
            } else if (!cached) {
                // Usuário novo: sem cache e sem dados na nuvem
                setView('setup');
            }
        }

        loadProgress();
    }, [user, authLoading]);

    /** Aplica um objeto de estado nos state hooks */
    function applyState(state) {
        setCurrentWeek(state.currentWeek   ?? 1);
        setCompletedDays(state.completedDays ?? []);
        setUserProfile(state.profile         ?? null);
        setCurrentPlanId(state.planId        ?? '5k');
    }

    // ----------------------------------------------------------
    // Persiste progresso sempre que o estado muda
    // Firestore é a fonte primária; localStorage é só cache.
    // ----------------------------------------------------------
    useEffect(() => {
        if (!user || ['loading', 'onboarding', 'setup'].includes(view)) return;

        const state = {
            currentWeek,
            completedDays,
            profile:  userProfile,
            planId:   currentPlanId
        };

        // Atualiza cache local imediatamente
        writeCache(user.uid, state);

        // Persiste na nuvem (Firestore) — sempre, não apenas quando online,
        // pois o Firestore SDK faz queue offline automaticamente
        saveProgressToCloud(user.uid, state);

    }, [user, currentWeek, completedDays, userProfile, currentPlanId, view]);

    // ----------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------

    const handleProfileComplete = useCallback(async (profile) => {
        const initialState = {
            currentWeek:   1,
            completedDays: [],
            profile,
            planId:        '5k'
        };

        setUserProfile(profile);
        setView('plan'); // navega imediatamente, sem esperar a nuvem

        if (user) {
            writeCache(user.uid, initialState);
            // Salva perfil E progresso inicial no Firestore em paralelo
            await Promise.all([
                saveUserProfile(user.uid, profile),
                saveProgressToCloud(user.uid, initialState)
            ]).catch(console.warn);
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

        // Salva treino no histórico Firestore
        await saveWorkoutToCloud(user.uid, {
            week:            Number(week),
            day:             Number(day),
            planId:          currentPlanId,
            title:           freeWorkout?.title || null,
            completedAt:     new Date().toISOString(),
            distanceKm:      stats?.distanceKm      || 0,
            durationSeconds: stats?.durationSeconds || 0
        });

        // Salva também no Google Sheets (histórico legado)
        if (activeDayKey) {
            await saveCompletedWorkout({
                userName:    user.displayName || user.email,
                week:        Number(week),
                day:         Number(day),
                completedAt: new Date().toISOString()
            });
        }
    }, [activeDayKey, user, registerToday, currentPlanId, freeWorkout]);

    const handleExitTimer = useCallback(() => {
        setActiveDayKey(null);
        setFreeWorkout(null);
        setView('plan');
    }, []);

    const handleLogout = useCallback(async () => {
        if (user) clearCache(user.uid); // limpa cache ao sair
        await logout();
    }, [user, logout]);

    // ----------------------------------------------------------
    // Render
    // ----------------------------------------------------------

    if (authLoading || view === 'loading') {
        return (
            <div className="app-shell app-loading">
                <img
                    src="/icons/192.png"
                    alt="BoraCorrer"
                    className="loading-logo"
                />
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

    // Vista padrão: plano semanal
    const weekPlan = getWeekPlan(currentWeek, currentPlanId);

    return (
        <div className="app-shell">

            {/* Banner offline */}
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
                currentPlanId={currentPlanId}
                onStartDay={handleStartDay}
                onChangeWeek={setCurrentWeek}
                onOpenModeSelect={() => setShowModeSelect(true)}
                userName={user.displayName || user.email}
                onSwitchUser={handleLogout}
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
