import React, { useState } from 'react';
import './onboarding.css';

export default function Onboarding({ onComplete }) {
    const [name, setName] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        const trimmedName = name.trim();
        if (trimmedName.length === 0) return;
        onComplete(trimmedName);
    }

    return (
        <div className="onboarding-container">
            <div className="onboarding-content">
                <div className="onboarding-icon">🏃</div>
                <h1>BoraCorrer</h1>
                <p>Do zero ao seu primeiro 5K, em 8 semanas, sem complicação.</p>

                <form onSubmit={handleSubmit} className="onboarding-form">
                    <label htmlFor="name-input">Como podemos te chamar?</label>
                    <input
                        id="name-input"
                        type="text"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="btn-primary" disabled={name.trim().length === 0}>
                        Começar minha jornada
                    </button>
                </form>
            </div>
        </div>
    );
}
