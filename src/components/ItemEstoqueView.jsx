import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listarEspacos } from '../services/espacoService';
import { listarItensEstoque } from '../services/itemEstoqueService';
import { extrairErro } from '../utils/apiUtils';
import {
    filtrarItensEstoque,
    ordenarItensEstoque
} from '../utils/itemEstoqueViewModel';
import MessageModal from './MessageModal';
import ItemEstoqueList from './itemEstoque/ItemEstoqueList';

export default function ItemEstoqueView({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [itens, setItens] = useState([]);
    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [pesquisa, setPesquisa] = useState('');

    const carregarDados = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;

        setLoading(true);
        setErro('');

        try {
            const resItens = await listarItensEstoque({ token, unidadeOrganizacionalId, filtro: pesquisa });
            const resEspacos = await listarEspacos({ token, unidadeOrganizacionalId });

            if (resItens.ok && resEspacos.ok) {
                const itensRecebidos = await resItens.json();
                const espacosRecebidos = await resEspacos.json();
                const itensFiltrados = filtrarItensEstoque(itensRecebidos, pesquisa, espacosRecebidos);

                setItens(ordenarItensEstoque(itensFiltrados));
                setEspacos(espacosRecebidos);
            } else {
                const mensagem = await extrairErro(!resItens.ok ? resItens : resEspacos);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, unidadeOrganizacionalId, pesquisa]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    useEffect(() => {
        if (!location.state?.sucesso) return;

        setSucesso(location.state.sucesso);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    const getNomeEspaco = (id) => {
        const espaco = espacos.find(e => e.espacoId === id);
        return espaco ? espaco.nome : 'Espaço Desconhecido';
    };

    const messageModal = (erro || sucesso) && (
        <MessageModal
            type={erro ? 'error' : 'success'}
            message={erro || sucesso}
            onClose={() => { setErro(''); setSucesso(''); }}
            autoClose={8000}
        />
    );

    return (
        <ItemEstoqueList
            getNomeEspaco={getNomeEspaco}
            itens={itens}
            loading={loading}
            onAbrirDetalhes={(item) => navigate(`/itens-estoque/${item.itemEstoqueId}`)}
            onAbrirNovo={() => navigate('/itens-estoque/novo')}
            onChangePesquisa={setPesquisa}
            pesquisa={pesquisa}
            messageModal={messageModal}
        />
    );
}