// ============================================================
// invitepage.jsx
// Página de convite pública — acessada via /convite/:uid
// Mostra o progresso do convidante e CTA para criar conta.
// ============================================================

import React, { useState, useEffect } from 'react';
import { loadPublicProfile } from '../services/firestore.js';
import './invitepage.css';

const TOTAL_WORKOUTS = 24;
const APP_URL        = 'https://bora-correr-mu.vercel.app';

// ============================================================
// Sub-componentes
// ============================================================

function ProgressRing({ percent, size = 120, stroke = 10 }) {
    const radius          = (size - stroke) / 2;
    const circumference   = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
        <svg width={size} height={size} className="progress-ring">
            {/* Trilha de fundo */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={stroke}
            />
            {/* Progresso */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#ring-gradient)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#f97316" />
                    <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
            </defs>
            {/* Texto central */}
            <text
                x={size / 2}
                y={size / 2 - 6}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="24"
                fontWeight="800"
                fontFamily="Inter, Arial, sans-serif"
            >
                {percent}%
            </text>
            <text
                x={size / 2}
                y={size / 2 + 14}
                textAnchor="middle"
                fill="rgba(255,255,255,0.5)"
                fontSize="11"
                fontFamily="Inter, Arial, sans-serif"
            >
                completo
            </text>
        </svg>
    );
}

function StatBadge({ emoji, value, label }) {
    return (
        <div className="invite-stat-badge">
            <span className="invite-stat-emoji">{emoji}</span>
            <span className="invite-stat-value">{value}</span>
            <span className="invite-stat-label">{label}</span>
        </div>
    );
}

// ============================================================
// Loading e Error states
// ============================================================

function LoadingState() {
    return (
        <div className="invite-page">
            <div className="invite-loading">
                <img src="/icons/192.png" alt="BoraCorrer" className="invite-logo-loading" />
                <p>Carregando...</p>
            </div>
        </div>
    );
}

function NotFoundState() {
    return (
        <div className="invite-page">
            <div className="invite-not-found">
                <div className="invite-not-found-icon">🤔</div>
                <h2>Link não encontrado</h2>
                <p>Este link de convite pode ter expirado ou é inválido.</p>
                <a href={APP_URL} className="invite-cta-btn">
                    Criar conta grátis
                </a>
            </div>
        </div>
    );
}

// ============================================================
// Página principal
// ============================================================

export default function InvitePage({ inviteUid }) {
    const [profile,  setProfile]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            if (!inviteUid) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            const data = await loadPublicProfile(inviteUid);

            if (!data) {
                setNotFound(true);
            } else {
                setProfile(data);
            }

            setLoading(false);
        }

        fetchProfile();
    }, [inviteUid]);

    if (loading)  return <LoadingState />;
    if (notFound) return <NotFoundState />;

    const completedCount   = profile.completedDays?.length ?? 0;
    const percent          = Math.round((completedCount / TOTAL_WORKOUTS) * 100);
    const currentWeek      = profile.currentWeek ?? 1;
    const displayName      = profile.displayName;
    const firstName        = displayName ? displayName.split(' ')[0] : null;
    const planLabel        = profile.planId === '10k' ? '5K → 10K' : 'Zero → 5K';

    // Mensagem personalizada baseada no progresso
    function getProgressMessage() {
        if (percent === 0)   return 'está começando a jornada de corrida!';
        if (percent < 25)    return `está na semana ${currentWeek} e já deu os primeiros passos!`;
        if (percent < 50)    return `já completou ${completedCount} treinos e está evoluindo muito!`;
        if (percent < 75)    return `está na metade do programa e não para de correr!`;
        if (percent < 100)   return `está quase completando o programa — ${completedCount} treinos feitos!`;
        return 'completou o programa inteiro! Agora é a sua vez!';
    }

    const signupUrl = `${APP_URL}?ref=${inviteUid}`;

    return (
        <div className="invite-page">

            {/* Header */}
            <div className="invite-hero">
                <div className="invite-hero-glow" />

                <img src="/icons/192.png" alt="BoraCorrer" className="invite-logo" />

                <h1 className="invite-app-name">BoraCorrer</h1>
                <p className="invite-tagline">Do zero ao seu primeiro 5K, em 8 semanas.</p>
            </div>

            {/* Card de progresso do convidante */}
            <div className="invite-card">

                <div className="invite-card-header">
                    <div className="invite-avatar">
                        {(firstName || '?')[0].toUpperCase()}
                    </div>
                    <div className="invite-card-text">
                        <div className="invite-inviter-name">
                            {firstName
                                ? `${firstName} te convidou!`
                                : 'Você foi convidado!'}
                        </div>
                        <div className="invite-inviter-progress">
                            {firstName
                                ? `${firstName} ${getProgressMessage()}`
                                : getProgressMessage()}
                        </div>
                    </div>
                </div>

                <div className="invite-divider" />

                {/* Stats */}
                <div className="invite-stats-row">
                    <ProgressRing percent={percent} />

                    <div className="invite-stats-badges">
                        <StatBadge emoji="📅" value={`Semana ${currentWeek}`}  label="atual" />
                        <StatBadge emoji="✅" value={completedCount}             label="treinos" />
                        <StatBadge emoji="🏆" value={planLabel}                  label="plano" />
                    </div>
                </div>

            </div>

            {/* Funcionalidades */}
            <div className="invite-features">
                <div className="invite-feature">
                    <span className="invite-feature-icon">🏃</span>
                    <span>Cronômetro Run/Walk inteligente com voz em português</span>
                </div>
                <div className="invite-feature">
                    <span className="invite-feature-icon">🗺️</span>
                    <span>GPS e mapa do percurso em tempo real</span>
                </div>
                <div className="invite-feature">
                    <span className="invite-feature-icon">📊</span>
                    <span>Coach virtual com análise pós-treino</span>
                </div>
                <div className="invite-feature">
                    <span className="invite-feature-icon">🎯</span>
                    <span>Plano progressivo de 8 semanas, do zero ao 5K</span>
                </div>
                <div className="invite-feature">
                    <span className="invite-feature-icon">☁️</span>
                    <span>Progresso salvo na nuvem — acesse em qualquer dispositivo</span>
                </div>
            </div>

            {/* CTA */}
            <div className="invite-cta-section">
                <a href={signupUrl} className="invite-cta-btn">
                    🚀 Começar minha jornada — grátis
                </a>
                <p className="invite-cta-sub">
                    Sem cartão de crédito · Instale como app no celular
                </p>
            </div>

            <div className="invite-footer">
                BoraCorrer · bora-correr-mu.vercel.app
            </div>

        </div>
    );
}
