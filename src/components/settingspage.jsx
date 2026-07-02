// ============================================================
// settingspage.jsx
// Tela de configurações do BoraCorrer.
// ============================================================

import React, { useState } from 'react';
import { useTheme }            from '../hooks/usetheme.js';
import { usePushNotification } from '../hooks/usepushnotification.js';
import InviteButton            from './invitebutton.jsx';
import './settingspage.css';

// ============================================================
// Sub-componentes
// ============================================================

function SettingsSection({ title, children }) {
    return (
        <div className="settings-section">
            <div className="settings-section-title">{title}</div>
            <div className="settings-section-body">{children}</div>
        </div>
    );
}

function SettingsRow({ icon, label, sublabel, right, onClick, danger }) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            className={`settings-row ${onClick ? 'clickable' : ''} ${danger ? 'danger' : ''}`}
            onClick={onClick}
        >
            <div className="settings-row-icon">{icon}</div>
            <div className="settings-row-text">
                <div className="settings-row-label">{label}</div>
                {sublabel && <div className="settings-row-sublabel">{sublabel}</div>}
            </div>
            {right && <div className="settings-row-right">{right}</div>}
        </Tag>
    );
}

function Toggle({ value, onChange }) {
    return (
        <button
            className={`settings-toggle ${value ? 'on' : ''}`}
            onClick={() => onChange(!value)}
            aria-checked={value}
            role="switch"
        >
            <span className="settings-toggle-thumb" />
        </button>
    );
}

// ============================================================
// Componente principal
// ============================================================

export default function SettingsPage({
    user,
    userProfile,
    currentPlanId,
    completedDays,
    onUpdateName,
    onLogout,
    onResetProfile,
}) {
    const { themeMode, setMode }                       = useTheme();
    const { isSupported, isEnabled, scheduleReminder } = usePushNotification();

    const [voiceEnabled, setVoiceEnabled] = useState(
        () => localStorage.getItem('boracorrer-voice') !== 'false'
    );
    const [editingName,  setEditingName]  = useState(false);
    const [nameInput,    setNameInput]    = useState(user?.displayName || '');
    const [savingName,   setSavingName]   = useState(false);
    const [nameSaved,    setNameSaved]    = useState(false);
    const [showLogout,   setShowLogout]   = useState(false);

    const firstName     = user?.displayName ? user.displayName.split(' ')[0] : 'Usuário';
    const totalWorkouts = completedDays.length;
    const planLabel     = currentPlanId === '10k' ? '5K → 10K' : 'Zero → 5K';

    function handleVoiceToggle(val) {
        setVoiceEnabled(val);
        localStorage.setItem('boracorrer-voice', String(val));
    }

    async function handleSaveName() {
        if (!nameInput.trim()) return;
        setSavingName(true);
        await onUpdateName(nameInput.trim());
        setSavingName(false);
        setNameSaved(true);
        setEditingName(false);
        setTimeout(() => setNameSaved(false), 2000);
    }

    const THEME_OPTIONS = [
        { value: 'auto',  label: '🌓 Automático', sub: 'Escuro às 19h, claro às 6h' },
        { value: 'dark',  label: '🌙 Escuro',      sub: 'Sempre escuro'               },
        { value: 'light', label: '☀️ Claro',        sub: 'Sempre claro'                },
    ];

    return (
        <div className="settings-page">
            <div className="settings-scroll">

                {/* Título da tela */}
                <h1 className="settings-title">Configurações</h1>

                {/* Cabeçalho de perfil */}
                <div className="settings-profile-header">
                    <div className="settings-avatar">
                        {(firstName || '?')[0].toUpperCase()}
                    </div>
                    <div className="settings-profile-info">
                        <div className="settings-profile-name">{user?.displayName || 'Usuário'}</div>
                        <div className="settings-profile-email">{user?.email}</div>
                    </div>
                </div>

                {/* Stats rápidos */}
                <div className="settings-stats-row">
                    <div className="settings-stat">
                        <div className="settings-stat-value">{totalWorkouts}</div>
                        <div className="settings-stat-label">Treinos</div>
                    </div>
                    <div className="settings-stat-divider" />
                    <div className="settings-stat">
                        <div className="settings-stat-value">{planLabel}</div>
                        <div className="settings-stat-label">Plano</div>
                    </div>
                    <div className="settings-stat-divider" />
                    <div className="settings-stat">
                        <div className="settings-stat-value">
                            {userProfile?.goal === 'race'   ? '🏁'
                           : userProfile?.goal === 'weight' ? '🔥'
                           : '❤️'}
                        </div>
                        <div className="settings-stat-label">
                            {userProfile?.goal === 'race'   ? 'Prova'
                           : userProfile?.goal === 'weight' ? 'Peso'
                           : 'Saúde'}
                        </div>
                    </div>
                </div>

                {/* ---- SEÇÃO: Perfil ---- */}
                <SettingsSection title="Perfil">
                    {editingName ? (
                        <div className="settings-name-edit">
                            <input
                                className="settings-name-input"
                                value={nameInput}
                                onChange={e => setNameInput(e.target.value)}
                                placeholder="Seu nome"
                                autoFocus
                            />
                            <div className="settings-name-actions">
                                <button
                                    className="settings-name-cancel"
                                    onClick={() => setEditingName(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="settings-name-save"
                                    onClick={handleSaveName}
                                    disabled={savingName || !nameInput.trim()}
                                >
                                    {savingName ? '...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <SettingsRow
                            icon="✏️"
                            label="Editar nome"
                            sublabel={nameSaved ? '✅ Nome atualizado!' : (user?.displayName || '—')}
                            right="›"
                            onClick={() => setEditingName(true)}
                        />
                    )}

                    <SettingsRow
                        icon="🎯"
                        label="Refazer perfil"
                        sublabel="Responder as perguntas de objetivo novamente"
                        right="›"
                        onClick={onResetProfile}
                    />
                </SettingsSection>

                {/* ---- SEÇÃO: Compartilhar ---- */}
                <SettingsSection title="Compartilhar">
                    <div className="settings-invite-wrapper">
                        <InviteButton
                            uid={user?.uid}
                            userName={user?.displayName}
                        />
                    </div>
                </SettingsSection>

                {/* ---- SEÇÃO: Aparência ---- */}
                <SettingsSection title="Aparência">
                    <div className="settings-theme-group">
                        {THEME_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                className={`settings-theme-option ${themeMode === opt.value ? 'active' : ''}`}
                                onClick={() => setMode(opt.value)}
                            >
                                <div>
                                    <div className="settings-theme-label">{opt.label}</div>
                                    <div className="settings-theme-sub">{opt.sub}</div>
                                </div>
                                {themeMode === opt.value && (
                                    <div className="settings-theme-check">✓</div>
                                )}
                            </button>
                        ))}
                    </div>
                </SettingsSection>

                {/* ---- SEÇÃO: Áudio e Voz ---- */}
                <SettingsSection title="Áudio e Voz">
                    <SettingsRow
                        icon="🗣️"
                        label="Voz do coach"
                        sublabel={voiceEnabled
                            ? '"Hora de correr!" e "Hora de caminhar!" ativados'
                            : 'Apenas bipes sonoros'}
                        right={<Toggle value={voiceEnabled} onChange={handleVoiceToggle} />}
                    />
                </SettingsSection>

                {/* ---- SEÇÃO: Notificações ---- */}
                {isSupported && (
                    <SettingsSection title="Notificações">
                        <SettingsRow
                            icon="🔔"
                            label="Lembretes de treino"
                            sublabel={isEnabled
                                ? 'Você receberá lembretes para treinar'
                                : 'Ativar notificações push no dispositivo'}
                            right={<Toggle value={isEnabled} onChange={scheduleReminder} />}
                        />
                    </SettingsSection>
                )}

                {/* ---- SEÇÃO: Sobre ---- */}
                <SettingsSection title="Sobre">
                    <SettingsRow
                        icon="📱"
                        label="BoraCorrer"
                        sublabel="Versão 1.0 · Do zero ao 5K em 8 semanas"
                    />
                    <SettingsRow
                        icon="🔒"
                        label="Seus dados"
                        sublabel="Salvos com segurança no Firebase. Nunca compartilhados."
                    />
                    <SettingsRow
                        icon="🌐"
                        label="Site"
                        sublabel="bora-correr-mu.vercel.app"
                        right="›"
                        onClick={() => window.open('https://bora-correr-mu.vercel.app', '_blank')}
                    />
                </SettingsSection>

                {/* ---- SEÇÃO: Conta ---- */}
                <SettingsSection title="Conta">
                    {showLogout ? (
                        <div className="settings-logout-confirm">
                            <p>Tem certeza? Você precisará de internet para entrar novamente.</p>
                            <div className="settings-logout-actions">
                                <button
                                    className="settings-logout-cancel"
                                    onClick={() => setShowLogout(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="settings-logout-confirm-btn"
                                    onClick={onLogout}
                                >
                                    Sair mesmo assim
                                </button>
                            </div>
                        </div>
                    ) : (
                        <SettingsRow
                            icon="🚪"
                            label="Sair da conta"
                            sublabel="Seu progresso fica salvo na nuvem"
                            right="›"
                            onClick={() => setShowLogout(true)}
                            danger
                        />
                    )}
                </SettingsSection>

            </div>
        </div>
    );
}
