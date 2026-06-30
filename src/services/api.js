// Substitua pela URL gerada ao publicar o Apps Script como Web App.
const API_BASE_URL = import.meta.env.VITE_SHEETS_API_URL || 'https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec';

// --- Leitura do plano estruturado (opcional, caso queira manter o plano no Sheets ao invés do código) ---
export async function fetchTrainingPlan() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=getPlan`);
        if (!response.ok) throw new Error('Falha ao buscar o plano');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar plano do Google Sheets:', error);
        return null;
    }
}

// --- Escrita do histórico de treino concluído ---
export async function saveCompletedWorkout({ userName, week, day, completedAt }) {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: 'logWorkout',
                userName,
                week,
                day,
                completedAt
            })
        });

        if (!response.ok) throw new Error('Falha ao salvar treino');
        return await response.json();
    } catch (error) {
        console.error('Erro ao salvar treino no Google Sheets:', error);
        return { success: false, error: error.message };
    }
}

// --- Leitura do histórico de um usuário ---
export async function fetchUserHistory(userName) {
    try {
        const response = await fetch(`${API_BASE_URL}?action=getHistory&userName=${encodeURIComponent(userName)}`);
        if (!response.ok) throw new Error('Falha ao buscar histórico');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar histórico do Google Sheets:', error);
        return [];
    }
}
