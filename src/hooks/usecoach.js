// ============================================================
// useCoach.js
// Coach virtual baseado em regras — sem API externa.
// Analisa os dados do treino e gera feedback personalizado.
// ============================================================

/**
 * Calcula o ritmo em min/km
 * @param {number} distanceKm
 * @param {number} durationSeconds
 * @returns {string} "MM:SS /km" ou null
 */
function calcPace(distanceKm, durationSeconds) {
    if (!distanceKm || distanceKm < 0.1) return null;
    const secondsPerKm = durationSeconds / distanceKm;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
}

/**
 * Classifica o ritmo para iniciantes
 * @param {number} distanceKm
 * @param {number} durationSeconds
 * @returns {'slow' | 'good' | 'fast' | null}
 */
function classifyPace(distanceKm, durationSeconds) {
    if (!distanceKm || distanceKm < 0.1) return null;
    const secondsPerKm = durationSeconds / distanceKm;
    const minutesPerKm = secondsPerKm / 60;

    if (minutesPerKm > 9) return 'slow';
    if (minutesPerKm > 6) return 'good';
    return 'fast';
}

/**
 * Gera o feedback principal baseado na semana e performance
 */
function generateMainFeedback({ weekNumber, distanceKm, durationSeconds, completedDays, streak, profile }) {
    const paceClass = classifyPace(distanceKm, durationSeconds);
    const hasGPS = distanceKm > 0.1;
    const totalWorkouts = completedDays.length;
    const goal = profile?.goal || 'health';
    const experience = profile?.experience || 'zero';

    // === PRIMEIRO TREINO ===
    if (totalWorkouts === 1) {
        return {
            title: '🎉 Primeiro treino concluído!',
            message: 'O passo mais difícil é o primeiro — e você já deu. A partir de agora é só manter o ritmo. Seu corpo vai se adaptar mais rápido do que você imagina.',
            tip: 'Dica: tente descansar pelo menos 1 dia entre os treinos para permitir a recuperação muscular.'
        };
    }

    // === SEMANA 1-2: Adaptação ===
    if (weekNumber <= 2) {
        const messages = [
            'Nas primeiras semanas, o objetivo não é velocidade — é criar o hábito. Você está no caminho certo.',
            'Seu corpo ainda está se adaptando ao esforço. Se sentir falta de ar, reduza o ritmo da caminhada.',
            'Consistência supera intensidade nessa fase. Aparecer 3x por semana já é 80% do trabalho.'
        ];
        return {
            title: '💪 Fase de adaptação',
            message: messages[totalWorkouts % messages.length],
            tip: paceClass === 'fast'
                ? '⚠️ Você está correndo rápido demais para um iniciante. Diminua o ritmo para conseguir conversar enquanto corre.'
                : '✅ Seu ritmo está ótimo para essa fase do programa.'
        };
    }

    // === SEMANA 3-4: Construção ===
    if (weekNumber <= 4) {
        let message = 'Você está na fase de construção de base. Os intervalos estão ficando mais longos — isso é progresso real.';

        if (paceClass === 'good' && hasGPS) {
            message = `Você está mantendo um ritmo consistente. Esse é exatamente o tipo de treino que constrói resistência duradoura.`;
        }

        return {
            title: '📈 Construindo resistência',
            message,
            tip: goal === 'weight'
                ? '🔥 Para queima de gordura, mantenha o esforço entre 60-70% da sua capacidade — você deve conseguir falar frases curtas enquanto corre.'
                : '💡 Respire pelo nariz sempre que possível. Isso indica que você está no ritmo aeróbico correto.'
        };
    }

    // === SEMANA 5-6: Progressão ===
    if (weekNumber <= 6) {
        return {
            title: '🚀 Você está evoluindo!',
            message: experience === 'zero'
                ? 'Chegar na semana 5 do zero absoluto é uma conquista enorme. Seu pulmão e coração já são mais eficientes do que quando você começou.'
                : 'Você está na fase mais exigente do programa. Cada treino aqui vale o dobro.',
            tip: hasGPS && distanceKm > 2
                ? `✅ ${distanceKm.toFixed(1)}km é uma distância excelente para essa semana. Continue assim!`
                : '💡 Foque na respiração rítmica: 2 passos inspirando, 2 passos expirando.'
        };
    }

    // === SEMANA 7-8: Reta final ===
    if (weekNumber <= 8) {
        return {
            title: '🏁 Reta final!',
            message: weekNumber === 8
                ? 'Você está na última semana. Em poucos dias vai cruzar a marca dos 5K. Acredite no processo — você treinou para isso.'
                : 'Faltam poucos treinos para completar o programa. Não desista agora — o melhor ainda está por vir.',
            tip: streak >= 3
                ? `🔥 ${streak} dias seguidos é impressionante. Só cuide para não se machucar — descanso faz parte do treino.`
                : '💡 Na semana final, durma bem e hidrate-se bastante. Seu corpo precisa estar recuperado.'
        };
    }

    // === PÓS 5K: Plano 10K ===
    return {
        title: '🏆 Você é um corredor agora!',
        message: goal === 'race'
            ? 'Você completou o programa 5K. Agora é hora de aumentar a distância. O plano 10K está disponível para você.'
            : 'Manter a regularidade é o novo objetivo. 3x por semana é suficiente para todos os benefícios de saúde.',
        tip: '💡 Considere fazer o plano 10K ou usar os treinos temáticos para variar a rotina.'
    };
}

/**
 * Gera análise de ritmo com comparação histórica
 */
function generatePaceAnalysis({ distanceKm, durationSeconds }) {
    if (!distanceKm || distanceKm < 0.1) {
        return {
            hasPace: false,
            message: 'Ative a localização no próximo treino para receber análise de ritmo e distância.'
        };
    }

    const pace = calcPace(distanceKm, durationSeconds);
    const paceClass = classifyPace(distanceKm, durationSeconds);

    const paceMessages = {
        slow: `Seu ritmo de ${pace} está conservador — ótimo para treinos de resistência e recuperação.`,
        good: `Ritmo de ${pace} — perfeito para um treino de base aeróbica. Continue assim!`,
        fast: `Ritmo de ${pace} — você está correndo forte! Cuide para não se cansar demais nos primeiros blocos.`
    };

    return {
        hasPace: true,
        pace,
        paceClass,
        message: paceMessages[paceClass]
    };
}

/**
 * Gera dica de recuperação baseada na frequência de treinos
 */
function generateRecoveryTip({ completedDays, streak }) {
    const recentDays = completedDays.slice(-5);

    if (streak >= 5) {
        return '⚠️ Você treinou muito nos últimos dias. Considere um dia de descanso completo amanhã para evitar lesões.';
    }

    if (recentDays.length >= 3) {
        return '✅ Sua frequência está ótima. Descanse bem hoje e alimente-se com proteínas para ajudar na recuperação muscular.';
    }

    return '💧 Hidrate-se bem nas próximas horas. Beba pelo menos 500ml de água após o treino.';
}

/**
 * Hook principal do coach
 */
export function useCoach() {
    function generateFeedback({ weekNumber, distanceKm, durationSeconds, completedDays, streak, profile }) {
        const main = generateMainFeedback({
            weekNumber,
            distanceKm,
            durationSeconds,
            completedDays,
            streak,
            profile
        });

        const paceAnalysis = generatePaceAnalysis({ distanceKm, durationSeconds });
        const recoveryTip = generateRecoveryTip({ completedDays, streak });

        // Métricas calculadas
        const calories = Math.round((distanceKm || 0) * 60 + (durationSeconds / 60) * 4);
        const pace = paceAnalysis.hasPace ? paceAnalysis.pace : null;

        return {
            main,
            paceAnalysis,
            recoveryTip,
            metrics: {
                calories,
                pace,
                distanceKm: distanceKm || 0,
                durationSeconds
            }
        };
    }

    return { generateFeedback };
}
