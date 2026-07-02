// ============================================================
// api.js — Integração com Google Sheets via Apps Script
// ============================================================
// O Sheets é um ESPELHO de leitura e painel admin.
// O Firestore continua sendo a fonte primária do app.
// Todas as chamadas aqui são fire-and-forget (não bloqueantes).
// ============================================================

const API_URL = import.meta.env.VITE_SHEETS_API_URL || '';

// ============================================================
// HELPER
// ============================================================

async function sheetsGet(params) {
    if (!API_URL) return null;

    try {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}?${query}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('[Sheets GET]', params.action, err.message);
        return null;
    }
}

async function sheetsPost(payload) {
    if (!API_URL) return null;

    try {
        const res = await fetch(API_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body:    JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('[Sheets POST]', payload.action, err.message);
        return null;
    }
}

// ============================================================
// USUÁRIOS
// ============================================================

/**
 * Espelha o cadastro do usuário no Sheets.
 * Chamado ao fazer login ou criar conta.
 */
export async function syncUserToSheets({ uid, email, displayName }) {
    return sheetsPost({
        action:      'saveUsuario',
        uid,
        email,
        displayName,
        lastLoginAt: new Date().toISOString(),
    });
}

// ============================================================
// PROGRESSO
// ============================================================

/**
 * Espelha o progresso do usuário no Sheets.
 * Chamado sempre que o progresso muda (sem bloquear a UI).
 */
export async function syncProgressToSheets({ uid, currentWeek, completedDays, planId, profile }) {
    return sheetsPost({
        action: 'saveProgresso',
        uid,
        currentWeek,
        completedDays,
        planId,
        profile,
    });
}

// ============================================================
// HISTÓRICO DE TREINOS
// ============================================================

/**
 * Registra um treino concluído no Sheets.
 * Mantido para retrocompatibilidade + dashboard admin.
 */
export async function saveCompletedWorkout({
    uid, userName, week, day, planId,
    title, completedAt, distanceKm, durationSeconds, calories
}) {
    return sheetsPost({
        action: 'saveHistorico',
        uid,
        userName,
        week,
        day,
        planId,
        title,
        completedAt,
        distanceKm,
        durationSeconds,
        calories,
    });
}

// ============================================================
// PREFERÊNCIAS
// ============================================================

/**
 * Espelha as preferências do usuário no Sheets.
 */
export async function syncPreferencesToSheets({ uid, theme, remindersEnabled, voiceEnabled }) {
    return sheetsPost({
        action: 'savePreferencias',
        uid,
        theme,
        remindersEnabled,
        voiceEnabled,
    });
}

// ============================================================
// STREAK
// ============================================================

/**
 * Registra uma data de treino no Sheets para cálculo de streak.
 * Chamado ao concluir um treino.
 */
export async function syncStreakDateToSheets({ uid, date }) {
    return sheetsPost({
        action: 'saveStreakDate',
        uid,
        date,
    });
}

// ============================================================
// DASHBOARD (leitura — uso admin)
// ============================================================

export async function fetchDashboard() {
    return sheetsGet({ action: 'getDashboard' });
}

export async function fetchHistoricoUsuario(uid) {
    return sheetsGet({ action: 'getHistorico', uid });
}
