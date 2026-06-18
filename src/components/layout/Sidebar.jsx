import { NavLink, useNavigate } from 'react-router-dom';
import ZeniteIcon from '../ZeniteIcon';

const isIOS = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
};

export default function Sidebar({ isAdmin, isInstalled, onInstallClick, onLogoutClick }) {
    const navigate = useNavigate();

    const closeMenu = () => {
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.checked = false;
            menuToggle.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    return (
        <>
            <div className="sidebar-overlay">
                <label htmlFor="menu-toggle" className="sidebar-backdrop-toggle"></label>
            </div>

            <aside className="sidebar">
                <button type="button" className="sidebar-close-icon" onClick={closeMenu} aria-label="Fechar menu">
                    <ZeniteIcon name="x" size={22} />
                </button>

                <div className="sidebar-body">
                    <div className="sidebar-brand-block">
                        <h3 className="sidebar-title">Zênite Tecnologia</h3>
                        <p className="sidebar-subtitle">Estoque Certo</p>
                    </div>
                    <div className="sidebar-nav">
                        <NavLink to="/" end onClick={closeMenu}>Início</NavLink>
                        <NavLink to="/espacos" onClick={closeMenu}>Espaços</NavLink>

                        {isAdmin && (
                            <NavLink to="/aprovar-usuarios" onClick={closeMenu}>Aprovar Usuários</NavLink>
                        )}

                        {!isInstalled && (
                            <NavLink
                                to="/instalar-ios"
                                onClick={async (event) => {
                                    closeMenu();
                                    if (isIOS()) return;

                                    event.preventDefault();
                                    const installed = await onInstallClick();
                                    if (!installed) navigate('/instalar-ios');
                                }}
                            >
                                Adicionar a tela inicial
                            </NavLink>
                        )}
                    </div>
                </div>

                <div className="sidebar-footer">
                    <NavLink
                        to="/perfil"
                        onClick={closeMenu}
                        className={({ isActive }) => `link-action text-center d-block mb-1 ${isActive ? 'active' : ''}`}
                    >
                        Alterar Meus Dados
                    </NavLink>

                    <button onClick={onLogoutClick} className="button button-danger sidebar-logout-button">
                        Sair do Sistema
                    </button>
                </div>
            </aside>
        </>
    );
}
