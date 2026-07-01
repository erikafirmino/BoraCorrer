// Cada treino é uma sequência de blocos: { type: 'run' | 'walk', seconds: number }

function buildIntervalWorkout(runSeconds, walkSeconds, repetitions, warmupSeconds = 300, cooldownSeconds = 300) {
    const blocks = [];
    blocks.push({ type: 'walk', seconds: warmupSeconds, label: 'Aquecimento' });
    for (let i = 0; i < repetitions; i++) {
        blocks.push({ type: 'run', seconds: runSeconds, label: 'Corrida' });
        blocks.push({ type: 'walk', seconds: walkSeconds, label: 'Caminhada' });
    }
    blocks.push({ type: 'walk', seconds: cooldownSeconds, label: 'Desaquecimento' });
    return blocks;
}

function buildContinuousRun(runSeconds, warmupSeconds = 300, cooldownSeconds = 300) {
    return [
        { type: 'walk', seconds: warmupSeconds, label: 'Aquecimento' },
        { type: 'run', seconds: runSeconds, label: 'Corrida Contínua' },
        { type: 'walk', seconds: cooldownSeconds, label: 'Desaquecimento' }
    ];
}

// ===== PLANO 1: DO ZERO AO 5K (8 semanas) =====
export const PLAN_5K = [
    {
        week: 1,
        title: 'Semana 1 - Primeiros Passos',
        description: '1 min correndo / 1m30 caminhando, 8 repetições',
        workout: buildIntervalWorkout(60, 90, 8)
    },
    {
        week: 2,
        title: 'Semana 2 - Ganhando Ritmo',
        description: '1m30 correndo / 2 min caminhando, 6 repetições',
        workout: buildIntervalWorkout(90, 120, 6)
    },
    {
        week: 3,
        title: 'Semana 3 - Consolidando',
        description: '2 min correndo / 2 min caminhando, 6 repetições',
        workout: buildIntervalWorkout(120, 120, 6)
    },
    {
        week: 4,
        title: 'Semana 4 - Resistência',
        description: '3 min correndo / 90s caminhando, 5 repetições',
        workout: buildIntervalWorkout(180, 90, 5)
    },
    {
        week: 5,
        title: 'Semana 5 - Avançando',
        description: '5 min correndo / 90s caminhando, 4 repetições',
        workout: buildIntervalWorkout(300, 90, 4)
    },
    {
        week: 6,
        title: 'Semana 6 - Quase Lá',
        description: '8 min correndo / 2 min caminhando, 3 repetições',
        workout: buildIntervalWorkout(480, 120, 3)
    },
    {
        week: 7,
        title: 'Semana 7 - Reta Final',
        description: '12 min correndo / 90s caminhando, 2 repetições',
        workout: buildIntervalWorkout(720, 90, 2)
    },
    {
        week: 8,
        title: 'Semana 8 - 5K Sem Parar! 🎉',
        description: '25 minutos de corrida contínua',
        workout: buildContinuousRun(1500)
    }
];

// ===== PLANO 2: DO 5K AO 10K (8 semanas) =====
export const PLAN_10K = [
    {
        week: 1,
        title: 'Semana 1 - Retomando o Ritmo',
        description: '25 min contínuos + 2 treinos de 20 min',
        workout: buildContinuousRun(1500)
    },
    {
        week: 2,
        title: 'Semana 2 - Construindo Base',
        description: '28 min contínuos',
        workout: buildContinuousRun(1680)
    },
    {
        week: 3,
        title: 'Semana 3 - Ampliando',
        description: '30 min contínuos',
        workout: buildContinuousRun(1800)
    },
    {
        week: 4,
        title: 'Semana 4 - Intervalo de Velocidade',
        description: '4 min rápido / 2 min leve, 5 repetições',
        workout: buildIntervalWorkout(240, 120, 5)
    },
    {
        week: 5,
        title: 'Semana 5 - Distância Crescente',
        description: '35 min contínuos',
        workout: buildContinuousRun(2100)
    },
    {
        week: 6,
        title: 'Semana 6 - Resistência',
        description: '40 min contínuos',
        workout: buildContinuousRun(2400)
    },
    {
        week: 7,
        title: 'Semana 7 - Quase Lá!',
        description: '45 min contínuos',
        workout: buildContinuousRun(2700)
    },
    {
        week: 8,
        title: 'Semana 8 - 10K Conquistado! 🏆',
        description: '55 min de corrida contínua',
        workout: buildContinuousRun(3300)
    }
];

// ===== TREINOS TEMÁTICOS AVULSOS =====
export const THEMED_WORKOUTS = [
    {
        id: 'fat_burn',
        emoji: '🔥',
        title: 'Queima de Gordura',
        description: 'Intervalos longos para maximizar o gasto calórico',
        duration: '35 min',
        workout: buildIntervalWorkout(300, 60, 5)
    },
    {
        id: 'speed',
        emoji: '⚡',
        title: 'Treino de Velocidade',
        description: 'Sprints curtos para melhorar sua performance',
        duration: '25 min',
        workout: [
            { type: 'walk', seconds: 300, label: 'Aquecimento' },
            { type: 'run', seconds: 30, label: 'Sprint' },
            { type: 'walk', seconds: 90, label: 'Recuperação' },
            { type: 'run', seconds: 30, label: 'Sprint' },
            { type: 'walk', seconds: 90, label: 'Recuperação' },
            { type: 'run', seconds: 30, label: 'Sprint' },
            { type: 'walk', seconds: 90, label: 'Recuperação' },
            { type: 'run', seconds: 30, label: 'Sprint' },
            { type: 'walk', seconds: 90, label: 'Recuperação' },
            { type: 'run', seconds: 30, label: 'Sprint' },
            { type: 'walk', seconds: 90, label: 'Recuperação' },
            { type: 'run', seconds: 30, label: 'Sprint' },
            { type: 'walk', seconds: 90, label: 'Recuperação' },
            { type: 'run', seconds: 30, label: 'Sprint' },
            { type: 'walk', seconds: 90, label: 'Recuperação' },
            { type: 'run', seconds: 30, label: 'Sprint' },
            { type: 'walk', seconds: 300, label: 'Desaquecimento' }
        ]
    },
    {
        id: 'recovery',
        emoji: '🧘',
        title: 'Recuperação Ativa',
        description: 'Caminhada rápida intercalada com trote leve',
        duration: '30 min',
        workout: buildIntervalWorkout(60, 120, 8)
    },
    {
        id: 'endurance',
        emoji: '🏅',
        title: 'Resistência',
        description: 'Corrida contínua em ritmo confortável',
        duration: '30 min',
        workout: buildContinuousRun(1800)
    },
    {
        id: 'hills',
        emoji: '⛰️',
        title: 'Simulação de Morro',
        description: 'Intervalos intensos para fortalecer pernas',
        duration: '32 min',
        workout: buildIntervalWorkout(120, 90, 7)
    },
    {
        id: 'free_20',
        emoji: '🎯',
        title: 'Corrida Livre 20min',
        description: 'Corra no seu ritmo por 20 minutos',
        duration: '20 min',
        workout: buildContinuousRun(1200)
    }
];

// ===== HELPERS =====
export const PLANS = {
    '5k': PLAN_5K,
    '10k': PLAN_10K
};

export function getWeekPlan(weekNumber, planId = '5k') {
    const plan = PLANS[planId] || PLAN_5K;
    return plan.find((p) => p.week === weekNumber) || plan[0];
}

export function getTotalDurationSeconds(workout) {
    return workout.reduce((acc, block) => acc + block.seconds, 0);
}

export const DAYS_PER_WEEK = 3;
export const TOTAL_WEEKS = 8;
export const PLAN = PLAN_5K; // Retrocompatibilidade
