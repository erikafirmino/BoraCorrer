// ============================================================
// bottomnav.jsx
// Barra de navegação inferior do BoraCorrer.
// ============================================================

import React from 'react';
import './bottomnav.css';

const TABS = [
    { id: 'home',     icon: '🏠', label: 'Início'     },
    { id: 'calendar', icon: '📅', label: 'Calendário'  },
    { id: 'history',  icon: '📊', label: 'Histórico'   },
    { id: 'settings', icon: '⚙️', label: 'Config'      },
];

export default function BottomNav({ activeTab, onTabChange }) {
    return (
        <nav className="bottom-nav" role="navigation" aria-label="Navegação principal">
            {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        className="bottom-nav-btn"
                        data-active={isActive}
                        onClick={() => onTabChange(tab.id)}
                        aria-label={tab.label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {isActive && <span className="bottom-nav-indicator" />}
                        <span className="bottom-nav-icon"
                            style={{ filter: isActive ? 'none' : 'grayscale(1) opacity(0.5)' }}
                        >
                            {tab.icon}
                        </span>
                        <span
                            className="bottom-nav-label"
                            style={{ color: isActive ? '#f97316' : undefined }}
                        >
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
