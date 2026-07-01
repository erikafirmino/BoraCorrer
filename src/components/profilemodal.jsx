import React, { useState } from 'react';
import './profilemodal.css';

export default function ProfileModal({ user, achievements, onSave, onClose }) {
    const [name, setName] = useState(user?.displayName || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    async function handleSave() {
        if (!name.trim() || name.trim() === user?.displayName) {
            onClose();
            return;
        }
        setSaving(true);
        const ok = await onSave(name.trim());
        setSaving(false);
        if (ok) {
            setSaved(true);
            setTimeout(onClose, 1000);
        }
    }

    const { unlocked, locked } = achievements;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="modal-handle" />

                {/* Cabeçalho */}
                <div className="modal-header">
                    <div className="profile-avatar">
                        {(user?.displayName || user?.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <div className="profile-name">{user?.displayName || 'Usuário'}</div>
                        <div className="profile-email">{user?.email}</div>
                    </div>
                </div>

                {/* Editar nome */}
                <div className="modal-section">
                    <div className="modal-section-title">Editar nome</div>
                    <div className="edit-name-row">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome"
                            className="edit-name-input"
                        />
                        <button
                            className="btn-save-name"
                            onClick={handleSave}
                            disabled={saving || !name.trim()}
                        >
                            {saved ? '✓' : saving ? '...' : 'Salvar'}
                        </button>
                    </div>
                </div>

                {/* Conquistas desbloqueadas */}
                <div className="modal-section">
                    <div className="modal-section-title">
                        Conquistas ({unlocked.length}/{unlocked.length + locked.length})
                    </div>
                    <div className="achievements-grid">
                        {unlocked.map((a) => (
                            <div key={a.id} className="achievement-card unlocked">
                                <div className="achievement-emoji">{a.emoji}</div>
                                <div className="achievement-title">{a.title}</div>
                                <div className="achievement-desc">{a.description}</div>
                            </div>
                        ))}
                        {locked.map((a) => (
                            <div key={a.id} className="achievement-card locked">
                                <div className="achievement-emoji">🔒</div>
                                <div className="achievement-title">{a.title}</div>
                                <div className="achievement-desc">{a.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button className="modal-close-btn" onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
}
