// Cada treino é uma sequência de blocos: { type: 'run' | 'walk', seconds: number }
// O plano evolui progressivamente ao longo de 8 semanas.

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

export const PLAN = [
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
        title: 'Semana 8 - 5K Sem Parar',
        description: '25 minutos de corrida contínua',
        workout: [
            { type: 'walk', seconds: 300, label: 'Aquecimento' },
            { type: 'run', seconds: 1500, label: 'Corrida Contínua' },
            { type: 'walk', seconds: 300, label: 'Desaquecimento' }
        ]
    }
];

export function getWeekPlan(weekNumber) {
    return PLAN.find((p) => p.week === weekNumber) || PLAN[0];
}

export function getTotalDurationSeconds(workout) {
    return workout.reduce((acc, block) => acc + block.seconds, 0);
}

export const DAYS_PER_WEEK = 3;
export const TOTAL_WEEKS = PLAN.length;
