import React from 'react';
import ThemeToggle from '../components/ThemeToggle';

export default function PendingApprovalPage({ onNavigate }) {
    return (
        <>
            <ThemeToggle />
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <div className="card auth-card" style={{ textAlign: 'center' }}>

                        <h2 style={{ marginBottom: '1rem', marginTop: 0, fontSize: '1.4rem', lineHeight: '1.3' }}>
                            Aguarde mais um pouco por favor.
                        </h2>

                        <p style={{ fontSize: '1.05rem', color: 'var(--zf-text-main)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            Seu cadastro ainda está sendo validado pelo administrador do sistema.
                        </p>

                        <button
                            type="button"
                            className="button button-outline"
                            style={{ width: '100%', margin: 0 }}
                            onClick={() => onNavigate('login')}
                        >
                            Voltar
                        </button>

                    </div>
                </div>
            </div>
        </>
    );
}