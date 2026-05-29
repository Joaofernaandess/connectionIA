import ThemeToggle from '../ThemeToggle';

export default function AppHeader() {
    return (
        <header className="app-header">
            <div className="app-header-left">
                <label htmlFor="menu-toggle" className="button button-outline btn-mobile header-menu-button">
                    ☰<span className="texto-mobile button-icon-text">Menu</span>
                </label>
            </div>

            <h3 className="app-brand">
                Estoque Certo
            </h3>

            <div className="app-header-right">
                <ThemeToggle fixo={false} />
            </div>
        </header>
    );
}