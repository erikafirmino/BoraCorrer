// ============================================================
// firestore.js
// Serviço de sincronização com Firestore.
//
// Coleções:
//   users/{uid}            → dados privados (auth obrigatória)
//   users/{uid}/workouts   → histórico de treinos
//   publicProfiles/{uid}   → dados públicos (leitura pública)
// ============================================================

import {
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.js';

// ============================================================
// PROGRESSO DO USUÁRIO (privado)
// ============================================================

/**
 * Carrega o progresso completo do usuário direto do Firestore.
 * Retorna null se não existir ou em caso de erro de rede.
 */
export async function loadProgressFromCloud(uid) {
    try {
        const ref  = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data();
        return null;
    } catch (err) {
        console.warn('Firestore: erro ao carregar progresso', err);
        return null;
    }
}

/**
 * Salva o progresso completo do usuário no Firestore.
 * Inclui: semana, dias concluídos, perfil, plano, preferências e streak.
 */
export async function saveProgressToCloud(uid, state) {
    try {
        const ref = doc(db, 'users', uid);
        await setDoc(
            ref,
            {
                currentWeek:      state.currentWeek      ?? 1,
                completedDays:    state.completedDays    ?? [],
                profile:          state.profile          ?? null,
                planId:           state.planId           ?? '5k',
                // Preferências (antes só no localStorage)
                theme:            state.theme            ?? 'auto',
                voiceEnabled:     state.voiceEnabled     ?? true,
                remindersEnabled: state.remindersEnabled ?? false,
                // Datas de streak (antes só no localStorage)
                trainedDates:     state.trainedDates     ?? [],
                updatedAt:        serverTimestamp()
            },
            { merge: true }
        );
    } catch (err) {
        console.warn('Firestore: erro ao salvar progresso', err);
    }
}

// ============================================================
// PREFERÊNCIAS (leitura rápida separada)
// ============================================================

/**
 * Salva apenas as preferências do usuário (tema, voz, lembretes).
 * Mais eficiente que salvar o estado completo ao trocar tema.
 */
export async function savePreferencesToCloud(uid, prefs) {
    try {
        const ref = doc(db, 'users', uid);
        await setDoc(
            ref,
            {
                theme:            prefs.theme            ?? 'auto',
                voiceEnabled:     prefs.voiceEnabled     ?? true,
                remindersEnabled: prefs.remindersEnabled ?? false,
                updatedAt:        serverTimestamp()
            },
            { merge: true }
        );
    } catch (err) {
        console.warn('Firestore: erro ao salvar preferências', err);
    }
}

// ============================================================
// STREAK — datas de treino
// ============================================================

/**
 * Adiciona uma data de treino ao array trainedDates no Firestore.
 * Evita duplicatas verificando antes de salvar.
 */
export async function addTrainedDate(uid, date) {
    try {
        const ref  = doc(db, 'users', uid);
        const snap = await getDoc(ref);

        const existing   = snap.exists() ? (snap.data().trainedDates ?? []) : [];
        const alreadyHas = existing.includes(date);

        if (!alreadyHas) {
            await setDoc(
                ref,
                { trainedDates: [...existing, date], updatedAt: serverTimestamp() },
                { merge: true }
            );
        }
    } catch (err) {
        console.warn('Firestore: erro ao adicionar data de streak', err);
    }
}

// ============================================================
// PERFIL PÚBLICO (leitura sem autenticação)
// ============================================================

/**
 * Salva dados públicos em publicProfiles/{uid}.
 * Esta coleção tem leitura pública — usada pela página de convite.
 */
export async function savePublicProfile(uid, { displayName, currentWeek, completedDays, planId }) {
    try {
        const ref = doc(db, 'publicProfiles', uid);
        await setDoc(
            ref,
            {
                displayName:   displayName   || '',
                currentWeek:   currentWeek   ?? 1,
                completedDays: completedDays ?? [],
                planId:        planId        ?? '5k',
                updatedAt:     serverTimestamp()
            },
            { merge: true }
        );
    } catch (err) {
        console.warn('Firestore: erro ao salvar perfil público', err);
    }
}

/**
 * Carrega o perfil público de um usuário pelo UID.
 * Não requer autenticação — acessível pela página de convite.
 */
export async function loadPublicProfile(uid) {
    try {
        const ref  = doc(db, 'publicProfiles', uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return snap.data();
    } catch (err) {
        console.warn('Firestore: erro ao carregar perfil público', err);
        return null;
    }
}

// ============================================================
// PERFIL DO USUÁRIO (privado)
// ============================================================

/**
 * Salva apenas o perfil (respostas do onboarding) no Firestore.
 */
export async function saveUserProfile(uid, profile) {
    try {
        const ref = doc(db, 'users', uid);
        await setDoc(
            ref,
            { profile, updatedAt: serverTimestamp() },
            { merge: true }
        );
    } catch (err) {
        console.warn('Firestore: erro ao salvar perfil', err);
    }
}

/**
 * Salva o displayName do usuário no Firestore.
 */
export async function saveDisplayName(uid, displayName) {
    try {
        const ref = doc(db, 'users', uid);
        await setDoc(ref, { displayName }, { merge: true });
    } catch (err) {
        console.warn('Firestore: erro ao salvar displayName', err);
    }
}

// ============================================================
// HISTÓRICO DE TREINOS (privado)
// ============================================================

/**
 * Salva um treino concluído na subcoleção workouts do usuário.
 */
export async function saveWorkoutToCloud(uid, workout) {
    try {
        const ref = collection(db, 'users', uid, 'workouts');
        await addDoc(ref, {
            ...workout,
            savedAt: serverTimestamp()
        });
    } catch (err) {
        console.warn('Firestore: erro ao salvar treino', err);
    }
}
