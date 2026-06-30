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

    const scheduleReminder = useCallback(async () => {
        const perm = await requestPermission();
        if (perm !== 'granted') return false;

        // Salva a preferência de lembrete
        localStorage.setItem('boracorrer-reminder', 'true');

        // Dispara uma notificação imediata de confirmação
        new Notification('BoraCorrer 🏃', {
            body: 'Lembretes ativados! Vamos correr juntos.',
            icon: '/icons/192.png',
            badge: '/icons/192.png'
        });

        return true;
    }, [requestPermission]);

    function notifyWorkoutDay() {
        const enabled = localStorage.getItem('boracorrer-reminder') === 'true';
        if (!enabled || permission !== 'granted') return;

        new Notification('BoraCorrer 🏃', {
            body: 'Hoje é dia de treino! Bora correr? 💪',
            icon: '/icons/192.png',
            badge: '/icons/192.png'
        });
    }

    const isSupported = 'Notification' in window;
    const isEnabled = permission === 'granted' &&
        localStorage.getItem('boracorrer-reminder') === 'true';

    return {
        permission,
        isSupported,
        isEnabled,
        scheduleReminder,
        notifyWorkoutDay
    };
}
