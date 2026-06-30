// ===== CONFIGURAÇÃO =====
const SHEET_ID = '1gjaJHnc1JNUFSyGIX2prcoRHEVHCkFE1FiPyq3xwAZA';
const PLAN_SHEET_NAME = 'Plano';
const HISTORY_SHEET_NAME = 'Historico';

// ===== ROTEAMENTO PRINCIPAL =====
function doGet(e) {
    const action = e.parameter.action;

    if (action === 'getPlan') {
        return jsonResponse(getPlanFromSheet());
    }

    if (action === 'getHistory') {
        const userName = e.parameter.userName || '';
        return jsonResponse(getHistoryForUser(userName));
    }

    return jsonResponse({ error: 'Ação inválida' });
}

function doPost(e) {
    let payload;

    try {
        payload = JSON.parse(e.postData.contents);
    } catch (err) {
        return jsonResponse({ success: false, error: 'JSON inválido' });
    }

    if (payload.action === 'logWorkout') {
        return jsonResponse(logWorkout(payload));
    }

    return jsonResponse({ success: false, error: 'Ação inválida' });
}

// ===== FUNÇÕES DE LEITURA =====
function getPlanFromSheet() {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(PLAN_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    return data.map((row) => {
        const entry = {};
        headers.forEach((header, index) => {
            entry[header] = row[index];
        });
        return entry;
    });
}

function getHistoryForUser(userName) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(HISTORY_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    return data
        .map((row) => {
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = row[index];
            });
            return entry;
        })
        .filter((entry) => entry.userName === userName);
}

// ===== FUNÇÕES DE ESCRITA =====
function logWorkout(payload) {
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(HISTORY_SHEET_NAME);

        sheet.appendRow([
            payload.userName || '',
            payload.week || '',
            payload.day || '',
            payload.completedAt || new Date().toISOString()
        ]);

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===== UTILITÁRIO =====
function jsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}
