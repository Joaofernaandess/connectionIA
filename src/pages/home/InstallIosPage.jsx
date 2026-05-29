import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const isAndroid = () => {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent || '');
};

export default function InstallIosPage() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const useLightTutorialImages = theme === 'dark';
    const android = isAndroid();

    useEffect(() => {
        const updateTheme = () => {
            setTheme(document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark');
        };

        updateTheme();

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, []);

    const themedImage = (name) => useLightTutorialImages ? `/${name}-white.jpeg` : `/${name}.jpeg`;

    if (android) {
        return (
            <div className="install-panel">
                <h3 className="install-title mb-2">Instale o Estoque Certo</h3>

                <h4 className="section-title-reset mb-1">Instalação no Android</h4>

                <p className="empty-state-text mb-2">Toque no menu do navegador e escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p>

                <p className="empty-state-text mb-3">Se essa opção não aparecer, atualize a página e tente novamente.</p>

                <button onClick={() => navigate('/')} className="button mt-2 mb-3">
                    Entendi
                </button>
            </div>
        );
    }

    return (
        <div className="install-panel">
            <h3 className="install-title mb-2">Instale o Estoque Certo</h3>

            <h4 className="section-title-reset mb-1">Role a tela e siga o tutorial</h4>

            <p className="empty-state-text mb-3">Para instalar o aplicativo, toque nos <b>...</b></p>

            <img src={themedImage('pg1')} alt="Tutorial de instalação 1" className="install-step-image" />

            <p>e depois em <b>"Compartilhar"</b>.</p>

            <img src={themedImage('pg2')} alt="Tutorial de instalação 2" className="install-step-image" />

            <p>Role a tela para baixo e clique em <b>"Adicionar a tela de início"</b> </p>

            <img src={themedImage('pg3')} alt="Tutorial de instalação 3" className="install-step-image" />

            <p>Depois clique em <b>"Adicionar"</b> </p>

            <img src="/pg4.jpeg" alt="Tutorial de instalação 4" className="install-step-image" />

            <p> assim o aplicativo será adicionado à sua tela de início.</p>

            <img src="/pg5.jpeg" alt="Tutorial de instalação 5" className="install-step-image" />

            <button onClick={() => navigate('/')} className="button mt-2 mb-3">
                Entendi
            </button>
        </div>
    );
}
