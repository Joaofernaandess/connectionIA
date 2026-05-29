import { useEffect, useState } from 'react';

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
            className={`button button-outline btn-mobile theme-toggle-button ${fixo ? 'theme-toggle-fixed' : ''}`}
            onClick={toggleTheme}
        >
            {theme === 'dark' ? (
                <>☀️<span className="texto-mobile button-icon-text">Modo Claro</span></>
            ) : (
                <>🌙<span className="texto-mobile button-icon-text">Modo Escuro</span></>
            )}
        </button>
    );
}