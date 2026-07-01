import { useMemo } from 'react';

// ===== CONQUISTAS =====
const ACHIEVEMENTS = [
    {
        id: 'first_workout',
        emoji: '🏅',
        title: 'Primeiro Passo',
        description: 'Completou seu primeiro treino!',
        check: (completedDays) => completedDays.length >= 1
    },
    {
        id: 'three_workouts',
        emoji: '🔥',
        title: 'Pegando Ritmo',
        description: 'Completou 3 treinos!',
        check: (completedDays) => completedDays.length >= 3
    },
    {
        id: 'first_week',
        emoji: '⭐',
        title: 'Semana 1 Completa',
        description: 'Finalizou a primeira semana!',
        check: (completedDays) => [1, 2, 3].every(d => completedDays.includes(`1-${d}`))
    },
    {
        id: 'halfway',
        emoji: '🚀',
        title: 'Na Metade!',
        description: 'Completou 12 treinos — metade do programa!',
        check: (completedDays) => completedDays.length >= 12
    },
    {
        id: 'streak_5',
        emoji: '💪',
        title: 'Sequência de Fogo',
        description: 'Treinou 5 dias seguidos!',
        check: (completedDays, streak) => streak >= 5
    },
    {
        id: 'week_4',
        emoji: '🏆',
        title: 'Um Mês Correndo',
        description: 'Chegou na semana 4 do programa!',
        check: (completedDays) => [1, 2, 3].every(d => completedDays.includes(`4-${d}`))
    },
    {
        id: 'finished',
        emoji: '🥇',
        title: '5K Conquistado!',
        description: 'Completou o programa inteiro de 8 semanas!',
        check: (completedDays) => completedDays.length >= 24
    }
];

export function useAchievements(completedDays, streak) {
    const unlocked = useMemo(() => {
        return ACHIEVEMENTS.filter(a => a.check(completedDays, streak));
    }, [completedDays, streak]);

    const locked = useMemo(() => {
        return ACHIEVEMENTS.filter(a => !a.check(completedDays, streak));
    }, [completedDays, streak]);

    // Retorna a conquista mais recentemente desbloqueada (para notificar)
    const latest = unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;

    return { unlocked, locked, latest, all: ACHIEVEMENTS };
}

// ===== FRASES MOTIVACIONAIS =====
const PHRASES = [
    (pct) => `Você completou ${pct}% do programa. Continue assim!`,
    (pct) => `Cada treino te aproxima do 5K. Já são ${pct}% concluídos!`,
    () => 'Consistência é mais importante que velocidade. Você está no caminho certo!',
    () => 'Seu futuro eu vai agradecer por cada treino de hoje.',
    (pct, days) => `${days} treinos concluídos. Isso é dedicação de verdade!`,
    () => 'Correr é 90% mental. Você já passou pela parte mais difícil: começar.',
    () => 'Cada passo conta. Cada minuto importa. Orgulhe-se do seu progresso!',
    (pct) => pct >= 50 ? 'Você está na reta final! Não para agora.' : 'Você está construindo uma versão mais saudável de si.',
];

export function getMotivationalPhrase(completedDays) {
    const total = 24;
    const pct = Math.round((completedDays.length / total) * 100);
    const days = completedDays.length;

    // Seleciona frase baseada no dia do mês para variar
    const idx = new Date().getDate() % PHRASES.length;
    return PHRASES[idx](pct, days);
}
