import {useLocation, useNavigate} from 'react-router-dom';
import ZeniteIcon from '../ZeniteIcon';

export default function ButtomNavBar() {
    const location = useLocation();
    const navigate = useNavigate();

    if (location.pathname !== '/') return null;

    return (
        <nav className="bottom-nav-bar">
            <button className="botton-nav-item" onCLick={() => navigate('/historico')}>
                <ZeniteIcon name="clock" size={24} />
                <span>Historico</span>
            </button>

            <button className="botton-nav-item botton-nav-center" onclick={() => navigate('/espacos')}>
                <ZeniteIcon name="plus" size={28} />
                <span>Adicionar</span>
            </button>

            <button className="bottom-nav-item" onclick={() => navigate('/perfil-usuario')}>
                <Zenite name="user" size={28} />
                <span>Conta</span>
            </button>

        </nav>
    );
}