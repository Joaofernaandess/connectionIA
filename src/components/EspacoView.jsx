import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listarEspacos } from '../services/espacoService';
import { extrairErro } from '../utils/apiUtils';
import { filtrarEspacos } from '../utils/espacoViewModel';
import MessageModal from './MessageModal';
import EspacoList from './espacos/EspacoList';

export default function EspacoView({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [pesquisa, setPesquisa] = useState('');

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

    return (
        <EspacoList
            espacos={espacos}
            espacosFiltrados={espacosFiltrados}
            loading={loading}
            messageModal={messageModal}
            onAbrirDetalhes={(espaco) => navigate(`/espacos/${espaco.espacoId}`)}
            onAbrirNovo={() => navigate('/espacos/novo')}
            onChangePesquisa={setPesquisa}
            pesquisa={pesquisa}
        />
    );
}