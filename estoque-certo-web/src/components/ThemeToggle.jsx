import React, { useState, useEffect } from 'react';

export default function ThemeToggle({ fixo = true }) {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <button
            onClick={toggleTheme}
            className="button button-outline"
            style={{
                margin: 0,
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                ...(fixo ? { position: 'fixed', top: '1rem', right: '1.5rem', zIndex: 10000 } : {})
            }}
        >
            {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
        </button>
    );
}