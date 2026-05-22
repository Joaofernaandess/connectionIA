import React, { useState } from 'react';

export default function PasswordInput({ label = "Senha", value, onChange, placeholder = "Senha", error, errorMessage }) {
    const [show, setShow] = useState(false);

    return (
        <div style={{ marginBottom: '1rem' }}>
            {/* Cor fixa, não muda mais com o erro */}
            <label style={{
                textAlign: 'left',
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '1.1rem',
                fontWeight: 'normal',
                color: 'inherit'
            }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    style={{
                        paddingRight: '2.5rem',
                        marginBottom: 0,
                        width: '100%',
                        border: error ? '1px solid #e99292' : undefined,
                        outlineColor: error ? '#e99292' : undefined
                    }}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                    }}
                >
                    {show ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                    )}
                </button>
            </div>
            {error && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px', textAlign: 'left' }}>{errorMessage}</small>}
        </div>
    );
}