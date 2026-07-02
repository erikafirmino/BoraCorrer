// ============================================================
// bottomnav.jsx
// Barra de navegação inferior do BoraCorrer.
// ============================================================

import React from 'react';
import './bottomnav.css';

const TABS = [
    { id: 'home',     icon: '🏠', label: 'Início'    },
    { id: 'calendar', icon: '📅', label: 'Calendário' },
    { id: 'history',  icon: '📊', label: 'Histórico'  },
    { id: 'settings', icon: '⚙️', label: 'Config'     },
];

export default function BottomNav({ activeTab, onTabChange }) {
    return (
        <nav className="bottom-nav">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    className={`bottom-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                    aria-label={tab.label}
                >
                    <span className="bottom-nav-icon">{tab.icon}</span>
                    <span className="bottom-nav-label">{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}
