import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listarEspacos } from '../services/espacoService';
import {
    excluirItemEstoque,
    listarItensEstoque,
    movimentarItemEstoque
} from '../services/itemEstoqueService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';
import {
    criarPayloadMovimentacao,
    filtrarItensEstoque,
    ordenarItensEstoque
} from '../utils/itemEstoqueViewModel';
import { formatQuantityInput, parseQuantity } from '../utils/quantity';
import MessageModal from './MessageModal';
import ExcluirItemModal from './itemEstoque/ExcluirItemModal';
import ItemEstoqueList from './itemEstoque/ItemEstoqueList';
import MovimentarEstoqueModal from './itemEstoque/MovimentarEstoqueModal';

export default function ItemEstoqueView({ token, unidadeOrganizacionalId, usuarioId }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [itens, setItens] = useState([]);
    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [pesquisa, setPesquisa] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [itemParaExcluir, setItemParaExcluir] = useState(null);
    const [excluindoItemId, setExcluindoItemId] = useState(null);
    const [itemParaMovimentar, setItemParaMovimentar] = useState(null);
    const [movimentacaoData, setMovimentacaoData] = useState({ tipoMovimentacao: 1, quantidadeMovimento: '' });

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

    const abrirMovimentacao = (item, tipoMovimentacao) => {
        setItemParaMovimentar(item);
        setMovimentacaoData({ tipoMovimentacao, quantidadeMovimento: '' });
        setFieldErrors({});
        setErro('');
        setSucesso('');
    };

    const handleMovimentar = async (event) => {
        event.preventDefault();
        if (!itemParaMovimentar) return;

        setErro('');
        setSucesso('');
        setFieldErrors({});

        const payload = criarPayloadMovimentacao({ movimentacaoData, usuarioId });

        try {
            const response = await movimentarItemEstoque({
                token,
                itemEstoqueId: itemParaMovimentar.itemEstoqueId,
                payload
            });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);

                const quantidadeAtual = parseQuantity(itemParaMovimentar.quantidade);
                const novaQuantidade = payload.tipoMovimentacao === 1
                    ? quantidadeAtual + payload.quantidade
                    : quantidadeAtual - payload.quantidade;

                setItens(prev => prev.map(item => (
                    item.itemEstoqueId === itemParaMovimentar.itemEstoqueId
                        ? { ...item, quantidade: novaQuantidade, quantidadeFormatada: formatQuantityInput(novaQuantidade) }
                        : item
                )));
                setItemParaMovimentar(null);
            } else if (response.status === 400) {
                await aplicarErrosCampos(response, setFieldErrors, setErro);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleExcluir = async () => {
        if (!itemParaExcluir) return;

        setErro('');
        setSucesso('');
        setExcluindoItemId(itemParaExcluir.itemEstoqueId);

        try {
            const response = await excluirItemEstoque({ token, itemEstoqueId: itemParaExcluir.itemEstoqueId });

            if (response.ok || response.status === 204) {
                const mensagem = await extrairMensagem(response);
                setItens(prev => prev.filter(item => item.itemEstoqueId !== itemParaExcluir.itemEstoqueId));
                if (mensagem) setSucesso(mensagem);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setExcluindoItemId(null);
            setItemParaExcluir(null);
        }
    };

    return (
        <>
            <ItemEstoqueList
                getNomeEspaco={getNomeEspaco}
                itens={itens}
                loading={loading}
                onAbrirMovimentacao={abrirMovimentacao}
                onAbrirNovo={() => navigate('/espacos')}
                onChangePesquisa={setPesquisa}
                onEditarItem={(item) => navigate(`/itens-estoque/${item.itemEstoqueId}`)}
                onExcluirItem={setItemParaExcluir}
                onHistoricoItem={(item) => navigate(`/itens-estoque/${item.itemEstoqueId}?secao=historico`)}
                pesquisa={pesquisa}
                excluindoItemId={excluindoItemId}
                messageModal={messageModal}
            />

            {itemParaMovimentar && (
                <MovimentarEstoqueModal
                    fieldErrors={fieldErrors}
                    item={itemParaMovimentar}
                    movimentacaoData={movimentacaoData}
                    onChange={setMovimentacaoData}
                    onClose={() => setItemParaMovimentar(null)}
                    onSubmit={handleMovimentar}
                />
            )}

            {itemParaExcluir && (
                <ExcluirItemModal
                    onClose={() => setItemParaExcluir(null)}
                    onConfirm={handleExcluir}
                />
            )}
        </>
    );
}