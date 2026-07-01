// ============================================================
// CoachFeedback.jsx
// Exibe o feedback do coach virtual após cada treino.
// ============================================================

import React, { useState } from 'react';
import './coachfeedback.css';

export default function CoachFeedback({ feedback }) {
    const [expanded, setExpanded] = useState(false);

    if (!feedback) return null;

    const { main, paceAnalysis, recoveryTip } = feedback;

    return (
        <div className="coach-card">

            {/* Cabeçalho do coach */}
            <div className="coach-header">
                <div className="coach-avatar">🏃‍♂️</div>
                <div className="coach-identity">
                    <div className="coach-name">Coach BoraCorrer</div>
                    <div className="coach-label">Análise do seu treino</div>
                </div>
            </div>

            {/* Feedback principal */}
            <div className="coach-main">
                <div className="coach-main-title">{main.title}</div>
                <p className="coach-main-message">{main.message}</p>
            </div>

            {/* Dica principal */}
            <div className="coach-tip">
                {main.tip}
            </div>

            {/* Expandir para mais detalhes */}
            <button
                className="coach-expand-btn"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? 'Ver menos ▲' : 'Ver análise completa ▼'}
            </button>

            {expanded && (
                <div className="coach-details">

                    {/* Análise de ritmo */}
                    <div className="coach-detail-section">
                        <div className="coach-detail-title">📍 Ritmo e distância</div>
                        <p className="coach-detail-text">{paceAnalysis.message}</p>
                        {paceAnalysis.hasPace && (
                            <div className="coach-pace-badge">
                                {paceAnalysis.paceClass === 'slow' && '🐢 Ritmo conservador'}
                                {paceAnalysis.paceClass === 'good' && '✅ Ritmo ideal'}
                                {paceAnalysis.paceClass === 'fast' && '⚡ Ritmo forte'}
                            </div>
                        )}
                    </div>

                    {/* Dica de recuperação */}
                    <div className="coach-detail-section">
                        <div className="coach-detail-title">😴 Recuperação</div>
                        <p className="coach-detail-text">{recoveryTip}</p>
                    </div>

                </div>
            )}

        </div>
    );
}
