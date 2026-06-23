import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import LoadingWaves from '../../components/LoadingWaves';
import MessageModal from '../../components/MessageModal';
import EspacoDetail from '../../components/espacos/EspacoDetail';
import MovimentarEstoqueModal from '../../components/itemEstoque/MovimentarEstoqueModal';
import TransferirItemModal from '../../components/itemEstoque/TransferirItemModal';
import {
    atualizarEspaco,
    listarEspacos,
    listarItensDoEspaco,
    obterEspaco
} from '../../services/espacoService';
import { excluirItemEstoque, movimentarItemEstoque, transferirItemEstoque } from '../../services/itemEstoqueService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../../utils/apiUtils';
import { criarPayloadEspaco } from '../../utils/espacoViewModel';
import { criarPayloadMovimentacao } from '../../utils/itemEstoqueViewModel';
import { parseQuantity } from '../../utils/quantity';

export default function EspacoDetailPage({ token, unidadeOrganizacionalId, usuarioId, mode = 'editar' }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { espacoId } = useParams();

    const espacoState = location.state?.espaco || null;
    const [espacoSelecionado, setEspacoSelecionado] = useState(espacoState);
    const [espacos, setEspacos] = useState([]);
    const [formEdicao, setFormEdicao] = useState({
        nome: espacoState?.nome || '',
        descricao: espacoState?.descricao || ''
    });
    const [itensDoEspaco, setItensDoEspaco] = useState([]);
    const [excluindoItemId, setExcluindoItemId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingItens, setLoadingItens] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [itemParaExcluir, setItemParaExcluir] = useState(null);
    const [itemParaMovimentar, setItemParaMovimentar] = useState(null);
    const [itemParaTransferir, setItemParaTransferir] = useState(null);
    const [novoEspacoId, setNovoEspacoId] = useState('');
    const [movimentacaoData, setMovimentacaoData] = useState({ tipoMovimentacao: 1, quantidadeMovimento: '' });

    const carregarItens = useCallback(async () => {
        if (!espacoId) return;

        setLoadingItens(true);
        try {
            const response = await listarItensDoEspaco({ token, espacoId });

            if (response.ok) {
                const itens = await response.json();
                setItensDoEspaco(itens);
            } else {
                const mensagem = await extrairErro(response);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingItens(false);
        }
    }, [token, espacoId]);

    const carregarEspaco = useCallback(async () => {
        if (!espacoId) return;

        setLoading(true);
        setErro('');
        setFieldErrors({});

        try {
            const response = await obterEspaco({ token, espacoId });
            const responseEspacos = await listarEspacos({ token, unidadeOrganizacionalId });

            if (response.ok && responseEspacos.ok) {
                const espaco = await response.json();
                const espacosRecebidos = await responseEspacos.json();
                setEspacoSelecionado(espaco);
                setEspacos(espacosRecebidos);
                setFormEdicao({ nome: espaco.nome, descricao: espaco.descricao || '' });
                carregarItens();
            } else {
                const mensagem = await extrairErro(!response.ok ? response : responseEspacos);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, espacoId, unidadeOrganizacionalId, carregarItens]);

    useEffect(() => {
        if (!espacoId) {
            navigate('/espacos', { replace: true });
            return;
        }

        carregarEspaco();
    }, [carregarEspaco, espacoId, navigate]);

    useEffect(() => {
        if (!location.state?.sucesso) return;

        setSucesso(location.state.sucesso);
        navigate(location.pathname, { replace: true, state: {} });
    }, [location.pathname, location.state, navigate]);

    const houveMudanca = espacoSelecionado && (
        espacoSelecionado.nome !== formEdicao.nome ||
        (espacoSelecionado.descricao || '') !== formEdicao.descricao
    );

    const handleConfirmarEdicao = async () => {
        setErro('');
        setSucesso('');
        setFieldErrors({});

        const payload = criarPayloadEspaco({ unidadeOrganizacionalId, formData: formEdicao });

        try {
            const response = await atualizarEspaco({ token, espacoId, payload });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                navigate('/espacos', { replace: true, state: { sucesso: mensagem } });
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

    const handleExcluirItem = async () => {
        if (!itemParaExcluir) return;

        setErro('');
        setSucesso('');
        setExcluindoItemId(itemParaExcluir.itemEstoqueId);

        try {
            const response = await excluirItemEstoque({ token, itemEstoqueId: itemParaExcluir.itemEstoqueId });

            if (response.ok || response.status === 204) {
                const mensagem = await extrairMensagem(response);
                setItensDoEspaco(prev => prev.filter(atual => atual.itemEstoqueId !== itemParaExcluir.itemEstoqueId));
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

    const abrirMovimentacaoItem = (item, tipoMovimentacao) => {
        setItemParaMovimentar(item);
        setMovimentacaoData({ tipoMovimentacao, quantidadeMovimento: '' });
        setFieldErrors({});
        setErro('');
        setSucesso('');
    };

    const handleMovimentarItem = async (event) => {
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
                    ? quantidadeAtual + payload.quantidadeMovimento
                    : quantidadeAtual - payload.quantidadeMovimento;

                setItensDoEspaco(prev => prev.map(item => (
                    item.itemEstoqueId === itemParaMovimentar.itemEstoqueId
                        ? { ...item, quantidade: novaQuantidade }
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

    const handleTransferirItem = async (event) => {
        event.preventDefault();
        if (!itemParaTransferir) return;

        setErro('');
        setSucesso('');
        setFieldErrors({});

        try {
            const response = await transferirItemEstoque({
                token,
                itemEstoqueId: itemParaTransferir.itemEstoqueId,
                novoEspacoId,
                usuarioId
            });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                setItensDoEspaco(prev => prev.filter(item => item.itemEstoqueId !== itemParaTransferir.itemEstoqueId));
                setItemParaTransferir(null);
                setNovoEspacoId('');
                if (mensagem) setSucesso(mensagem);
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

    const messageModal = (erro || sucesso) && (
        <MessageModal
            type={erro ? 'error' : 'success'}
            message={erro || sucesso}
            onClose={() => { setErro(''); setSucesso(''); }}
            autoClose={8000}
        />
    );

    if ((loading || !espacoSelecionado) && mode !== 'itens') {
        return (
            <div className="detail-view w-full detail-form-view">
                <div className="detail-heading">
                    <h2 className="page-title no-margin">Detalhes do Espaço</h2>
                </div>
                <div className="detail-form-layout">
                    <LoadingWaves variant="detail" rows={1} label="Carregando espaço" className="detail-loading-waves" />
                </div>
                {messageModal}
            </div>
        );
    }

    return (
        <>
            <EspacoDetail
                fieldErrors={fieldErrors}
                formEdicao={formEdicao}
                houveMudanca={houveMudanca}
                itensDoEspaco={itensDoEspaco}
                loadingItens={mode === 'itens' ? loading || loadingItens : loadingItens}
                messageModal={messageModal}
                mode={mode}
                onChangeFormEdicao={setFormEdicao}
                onCloseDeleteItem={() => setItemParaExcluir(null)}
                onConfirmarEdicao={handleConfirmarEdicao}
                onConfirmDeleteItem={handleExcluirItem}
                onEditarItem={(item) => navigate(`/itens-estoque/${item.itemEstoqueId}`, { state: { espacoOrigemId: espacoId } })}
                onExcluirItem={setItemParaExcluir}
                onHistoricoItem={(item) => navigate(`/itens-estoque/${item.itemEstoqueId}?secao=historico`, { state: { espacoOrigemId: espacoId } })}
                onNovoItem={() => navigate(`/itens-estoque/novo?espacoId=${espacoId}`, { state: { espacoId } })}
                onAbrirMovimentacaoItem={abrirMovimentacaoItem}
                onTransferirItem={(item) => {
                    setItemParaTransferir(item);
                    setNovoEspacoId('');
                    setFieldErrors({});
                }}
                onVoltar={() => navigate('/espacos')}
                excluindoItemId={excluindoItemId}
                showDeleteItemModal={!!itemParaExcluir}
            />
            {itemParaMovimentar && (
                <MovimentarEstoqueModal
                    fieldErrors={fieldErrors}
                    item={itemParaMovimentar}
                    movimentacaoData={movimentacaoData}
                    onChange={setMovimentacaoData}
                    onClose={() => setItemParaMovimentar(null)}
                    onSubmit={handleMovimentarItem}
                />
            )}
            {itemParaTransferir && (
                <TransferirItemModal
                    espacos={espacos}
                    fieldErrors={fieldErrors}
                    item={itemParaTransferir}
                    novoEspacoId={novoEspacoId}
                    onChange={setNovoEspacoId}
                    onClose={() => {
                        setItemParaTransferir(null);
                        setNovoEspacoId('');
                        setFieldErrors({});
                    }}
                    onSubmit={handleTransferirItem}
                />
            )}
        </>
    );
}
