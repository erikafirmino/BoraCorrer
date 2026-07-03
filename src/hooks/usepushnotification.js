// ============================================================
// usepushnotification.js
// Gerencia notificações push do BoraCorrer.
// ============================================================

import { useState, useCallback } from 'react';

export function usePushNotification() {
    const [permission, setPermission] = useState(
        'Notification' in window ? Notification.permission : 'unsupported'
    );

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return 'unsupported';
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
    }, []);

    /**
     * Solicita permissão e dispara notificação de confirmação.
     * Retorna true se a permissão foi concedida.
     */
    const requestAndNotify = useCallback(async () => {
        const perm = await requestPermission();
        if (perm !== 'granted') return false;

        try {
            new Notification('BoraCorrer 🏃', {
                body: 'Lembretes ativados! Vamos correr juntos.',
                icon: '/icons/192.png',
                badge: '/icons/192.png',
            });
        } catch (err) {
            console.warn('Notificação de confirmação falhou:', err);
        }

        return true;
    }, [requestPermission]);

    function notifyWorkoutDay() {
        if (permission !== 'granted') return;
        try {
            new Notification('BoraCorrer 🏃', {
                body: 'Hoje é dia de treino! Bora correr? 💪',
                icon: '/icons/192.png',
                badge: '/icons/192.png',
            });
        } catch (err) {
            console.warn('Notificação falhou:', err);
        }
    }

    const isSupported = 'Notification' in window;

    return {
        permission,
        isSupported,
        requestAndNotify,
        notifyWorkoutDay,
    };
}
