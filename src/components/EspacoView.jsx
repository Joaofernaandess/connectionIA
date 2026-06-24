import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { excluirEspaco, listarEspacos } from '../services/espacoService';
import { extrairErro, extrairMensagem } from '../utils/apiUtils';
import { filtrarEspacos } from '../utils/espacoViewModel';
import MessageModal from './MessageModal';
import EspacoList from './espacos/EspacoList';
import ExcluirEspacoModal from './espacos/ExcluirEspacoModal';

export default function EspacoView({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [pesquisa, setPesquisa] = useState('');
    const [espacoParaExcluir, setEspacoParaExcluir] = useState(null);

    const carregarEspacos = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;

        setLoading(true);
        setErro('');

        try {
            const response = await listarEspacos({ token, unidadeOrganizacionalId });

            if (response.ok) {
                setEspacos(await response.json());
            } else {
                const mensagem = await extrairErro(response);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, unidadeOrganizacionalId]);

    useEffect(() => {
        carregarEspacos();
    }, [carregarEspacos]);

    useEffect(() => {
        if (!location.state?.sucesso) return;

        setSucesso(location.state.sucesso);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        if (!erro && !sucesso) return;

        const timer = setTimeout(() => {
            setErro('');
            setSucesso('');
        }, 8000);
        return () => clearTimeout(timer);
    }, [erro, sucesso]);

    const espacosFiltrados = filtrarEspacos(espacos, pesquisa);

    const messageModal = (erro || sucesso) && (
        <MessageModal
            type={erro ? 'error' : 'success'}
            message={erro || sucesso}
            onClose={() => { setErro(''); setSucesso(''); }}
            autoClose={8000}
        />
    );

    const handleExcluirEspaco = async () => {
        if (!espacoParaExcluir) return;

        setErro('');
        setSucesso('');

        try {
            const response = await excluirEspaco({ token, espacoId: espacoParaExcluir.espacoId });

            if (response.ok || response.status === 204) {
                const mensagem = await extrairMensagem(response);
                setEspacos(prev => prev.filter(espaco => espaco.espacoId !== espacoParaExcluir.espacoId));
                if (mensagem) setSucesso(mensagem);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setEspacoParaExcluir(null);
        }
    };

    return (
        <>
            <EspacoList
                espacos={espacos}
                espacosFiltrados={espacosFiltrados}
                loading={loading}
                messageModal={messageModal}
                onEditarEspaco={(espaco) => navigate(`/espacos/${espaco.espacoId}`)}
                onExcluirEspaco={setEspacoParaExcluir}
                onGerenciarItens={(espaco) => navigate(`/espacos/${espaco.espacoId}/itens`, { state: { espaco } })}
                onAbrirNovo={() => navigate('/espacos/novo')}
                onChangePesquisa={setPesquisa}
                pesquisa={pesquisa}
            />

            {espacoParaExcluir && (
                <ExcluirEspacoModal
                    onClose={() => setEspacoParaExcluir(null)}
                    onConfirm={handleExcluirEspaco}
                />
            )}
        </>
    );
}
