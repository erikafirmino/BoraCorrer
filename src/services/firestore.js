// ============================================================
// firestore.js
// Serviço de sincronização com Firestore.
// Firestore é a fonte primária de dados — localStorage é
// apenas um cache para performance e uso offline.
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
// PROGRESSO DO USUÁRIO
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
 * Inclui: semana atual, dias concluídos, perfil e plano ativo.
 * Usa merge:true para nunca sobrescrever campos não enviados.
 */
export async function saveProgressToCloud(uid, state) {
    try {
        const ref = doc(db, 'users', uid);
        await setDoc(
            ref,
            {
                currentWeek:   state.currentWeek   ?? 1,
                completedDays: state.completedDays ?? [],
                profile:       state.profile       ?? null,
                planId:        state.planId        ?? '5k',
                updatedAt:     serverTimestamp()
            },
            { merge: true }
        );
    } catch (err) {
        console.warn('Firestore: erro ao salvar progresso', err);
    }
}

// ============================================================
// PERFIL DO USUÁRIO
// ============================================================

/**
 * Salva apenas o perfil (respostas do onboarding) no Firestore.
 */
export async function saveUserProfile(uid, profile) {
    try {
        const ref = doc(db, 'users', uid);
        await setDoc(
            ref,
            {
                profile,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );
    } catch (err) {
        console.warn('Firestore: erro ao salvar perfil', err);
    }
}

// ============================================================
// PERFIL PÚBLICO (para página de convite)
// ============================================================

/**
 * Carrega dados públicos de um usuário pelo UID.
 * Retorna apenas nome, progresso e semana — sem dados sensíveis.
 */
export async function loadPublicProfile(uid) {
    try {
        const ref  = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;

        const data = snap.data();

        // Retorna apenas campos públicos
        return {
            currentWeek:   data.currentWeek   ?? 1,
            completedDays: data.completedDays ?? [],
            planId:        data.planId        ?? '5k',
            displayName:   data.displayName   ?? null,
        };
    } catch (err) {
        console.warn('Firestore: erro ao carregar perfil público', err);
        return null;
    }
}

/**
 * Salva o displayName do usuário no Firestore para uso na página de convite.
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
// HISTÓRICO DE TREINOS
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
