import React, { useState } from 'react';
import './profilesetup.css';

const STEPS = [
    {
        id: 'experience',
        question: 'Qual é sua experiência com corrida?',
        emoji: '🏃',
        options: [
            { value: 'zero', label: 'Nunca corri', description: 'Começo do zero absoluto' },
            { value: 'occasional', label: 'Já corri um pouco', description: 'Mas sem regularidade' },
            { value: 'returning', label: 'Voltando após pausa', description: 'Já tive mais condicionamento' }
        ]
    },
    {
        id: 'goal',
        question: 'Qual é o seu principal objetivo?',
        emoji: '🎯',
        options: [
            { value: 'health', label: 'Saúde e bem-estar', description: 'Quero me mover mais' },
            { value: 'weight', label: 'Perder peso', description: 'Foco em queimar calorias' },
            { value: 'race', label: 'Completar um 5K', description: 'Tenho uma meta de prova' }
        ]
    },
    {
        id: 'availability',
        question: 'Quantos dias por semana você pode treinar?',
        emoji: '📅',
        options: [
            { value: '2', label: '2 dias', description: 'Ritmo mais leve' },
            { value: '3', label: '3 dias', description: 'Recomendado para iniciantes' },
            { value: '4', label: '4 dias', description: 'Progresso mais rápido' }
        ]
    }
];

export function getPersonalizedMessage(profile) {
    if (!profile) return null;
    const messages = {
        zero: {
            health: 'Foco em criar o hábito. Calma e constância!',
            weight: 'Treino intervalado é ideal para queimar calorias.',
            race: 'Em 8 semanas você vai cruzar a linha de chegada!'
        },
        occasional: {
            health: 'Você já tem uma base. Vamos construir consistência.',
            weight: 'Com sua experiência, o progresso vai ser mais rápido!',
            race: 'Você está bem posicionado. Vamos nessa!'
        },
        returning: {
            health: 'O corpo tem memória muscular. Vai fluir!',
            weight: 'Retornar é sempre a parte mais difícil. Você já fez isso!',
            race: '8 semanas é mais que suficiente com seu histórico.'
        }
    };
    return messages[profile.experience]?.[profile.goal] || null;
}

export default function ProfileSetup({ onComplete }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [selected, setSelected] = useState(null);

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;
    const progress = (step / STEPS.length) * 100;

    function handleSelect(value) {
        setSelected(value);
        const newAnswers = { ...answers, [current.id]: value };
        setAnswers(newAnswers);

        setTimeout(() => {
            setSelected(null);
            if (isLast) {
                onComplete(newAnswers);
            } else {
                setStep((s) => s + 1);
            }
        }, 350);
    }

    function handleSkip() {
        // Pula com valores padrão para não travar
        const defaults = { experience: 'zero', goal: 'health', availability: '3' };
        onComplete({ ...defaults, ...answers });
    }

    return (
        <div className="setup-container">
            <div className="setup-header">
                <div className="setup-progress-bar">
                    <div className="setup-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="setup-step-row">
                    <span className="setup-step-label">{step + 1} de {STEPS.length}</span>
                    <button className="setup-skip" onClick={handleSkip}>Pular →</button>
                </div>
            </div>

            <div className="setup-content">
                <div className="setup-emoji">{current.emoji}</div>
                <h2 className="setup-question">{current.question}</h2>

                <div className="setup-options">
                    {current.options.map((opt) => {
                        const isSelected = selected === opt.value;
                        return (
                            <button
                                key={opt.value}
                                className={`setup-option ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelect(opt.value)}
                            >
                                <div className="setup-option-text">
                                    <div className="setup-option-label">{opt.label}</div>
                                    <div className="setup-option-desc">{opt.description}</div>
                                </div>
                                <div className={`setup-option-check ${isSelected ? 'visible' : ''}`}>✓</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {step > 0 && (
                <button className="setup-back" onClick={() => setStep((s) => s - 1)}>
                    ← Voltar
                </button>
            )}
        </div>
    );
}
