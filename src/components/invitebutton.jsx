// ============================================================
// invitebutton.jsx
// Botão de convite que gera e compartilha o link único.
// ============================================================

import React, { useState } from 'react';
import './invitebutton.css';

const APP_URL = 'https://bora-correr-mu.vercel.app';

export default function InviteButton({ uid, userName }) {
    const [copied, setCopied] = useState(false);

    const inviteUrl = `${APP_URL}/convite/${uid}`;
    const firstName = userName ? userName.split(' ')[0] : 'eu';

    async function handleShare() {
        const text =
            `🏃 ${firstName} te convida para o BoraCorrer!\n\n` +
            `Eu estou correndo e quero você junto! É um app grátis que te leva do zero ao 5K em 8 semanas, com treinos guiados em português.\n\n` +
            `👉 Entre pelo meu link: ${inviteUrl}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'BoraCorrer — Vamos correr juntos!',
                    text,
                    url:   inviteUrl,
                });
            } catch {}
        } else {
            try {
                await navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            } catch {
                prompt('Copie seu link de convite:', inviteUrl);
            }
        }
    }

    return (
        <button className="invite-btn" onClick={handleShare}>
            <span className="invite-btn-icon">🔗</span>
            <div className="invite-btn-text">
                <div className="invite-btn-label">
                    {copied ? '✅ Link copiado!' : 'Convidar amigos'}
                </div>
                <div className="invite-btn-sub">
                    {copied ? 'Cole no WhatsApp ou Instagram' : 'Compartilhe seu link de convite'}
                </div>
            </div>
            <span className="invite-btn-arrow">›</span>
        </button>
    );
}
