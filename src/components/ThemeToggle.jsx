import React, { useEffect, useState } from 'react';

export default function ThemeToggle({ fixo = true }) {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <button
            type="button"
            className="button button-outline btn-mobile"
            onClick={toggleTheme}
            style={{
                margin: fixo ? '1rem' : 0,
                position: fixo ? 'fixed' : 'static',
                top: fixo ? '1rem' : 'auto',
                right: fixo ? '1rem' : 'auto',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center'
            }}
        >
            {theme === 'dark' ? (
                <>☀️<span className="texto-mobile" style={{ marginLeft: '8px' }}>Modo Claro</span></>
            ) : (
                <>🌙<span className="texto-mobile" style={{ marginLeft: '8px' }}>Modo Escuro</span></>
            )}
        </button>
    );
}