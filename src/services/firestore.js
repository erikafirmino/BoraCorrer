import {
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.js';

// ===== PROGRESSO DO USUÁRIO =====

export async function loadProgressFromCloud(uid) {
    try {
        const ref = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data();
        return null;
    } catch (err) {
        console.warn('Firestore: erro ao carregar progresso', err);
        return null;
    }
}

export async function saveProgressToCloud(uid, state) {
    try {
        const ref = doc(db, 'users', uid);
        await setDoc(ref, {
            currentWeek: state.currentWeek,
            completedDays: state.completedDays,
            profile: state.profile || null,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.warn('Firestore: erro ao salvar progresso', err);
    }
}

// ===== PERFIL DO USUÁRIO =====

export async function saveUserProfile(uid, profile) {
    try {
        const ref = doc(db, 'users', uid);
        await setDoc(ref, {
            profile,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.warn('Firestore: erro ao salvar perfil', err);
    }
}

// ===== HISTÓRICO DE TREINOS =====

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
