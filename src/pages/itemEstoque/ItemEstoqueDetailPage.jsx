import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingWaves from '../../components/LoadingWaves';
import MessageModal from '../../components/MessageModal';
import ItemEstoqueDetail from '../../components/itemEstoque/ItemEstoqueDetail';
import { listarEspacos } from '../../services/espacoService';
import {
    atualizarItemEstoque,
    excluirItemEstoque,
    listarHistoricoItem,
    movimentarItemEstoque,
    obterItemEstoque,
    transferirItemEstoque
} from '../../services/itemEstoqueService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../../utils/apiUtils';
import {
    criarPayloadItemEstoque,
    criarPayloadMovimentacao
} from '../../utils/itemEstoqueViewModel';
import { formatQuantityInput, parseQuantity } from '../../utils/quantity';

export default function ItemEstoqueDetailPage({ token, unidadeOrganizacionalId, usuarioId }) {
    const navigate = useNavigate();
    const { itemEstoqueId } = useParams();

    const [itemAtivo, setItemAtivo] = useState(null);
    const [espacos, setEspacos] = useState([]);
    const [historico, setHistorico] = useState([]);
    const [formEdicao, setFormEdicao] = useState({ espacoId: '', descricao: '', tipoUnidadeMedida: 1, quantidade: '' });
    const [movimentacaoData, setMovimentacaoData] = useState({ tipoMovimentacao: 1, quantidadeMovimento: '' });
    const [novoEspacoId, setNovoEspacoId] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingHistorico, setLoadingHistorico] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMovimentarModal, setShowMovimentarModal] = useState(false);
    const [showTransferirModal, setShowTransferirModal] = useState(false);

    const carregarHistorico = useCallback(async () => {
        if (!itemEstoqueId) return;

        setLoadingHistorico(true);
        try {
            const response = await listarHistoricoItem({ token, itemEstoqueId });
            if (response.ok) {
                setHistorico(await response.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistorico(false);
        }
    }, [token, itemEstoqueId]);

    const carregarDados = useCallback(async () => {
        if (!itemEstoqueId || !unidadeOrganizacionalId) return;

        setLoading(true);
        setErro('');
        setFieldErrors({});

        try {
            const responseItem = await obterItemEstoque({ token, itemEstoqueId });
            const responseEspacos = await listarEspacos({ token, unidadeOrganizacionalId });

            if (responseItem.ok && responseEspacos.ok) {
                const item = await responseItem.json();
                const espacosRecebidos = await responseEspacos.json();

                setItemAtivo(item);
                setEspacos(espacosRecebidos);
                setFormEdicao({
                    espacoId: item.espacoId || '',
                    descricao: item.descricao || '',
                    tipoUnidadeMedida: item.tipoUnidadeMedida || 1,
                    quantidade: formatQuantityInput(item.quantidade || 0)
                });
                carregarHistorico();
            } else {
                const mensagem = await extrairErro(!responseItem.ok ? responseItem : responseEspacos);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, itemEstoqueId, unidadeOrganizacionalId, carregarHistorico]);

    useEffect(() => {
        if (!itemEstoqueId) {
            navigate('/itens-estoque', { replace: true });
            return;
        }

        carregarDados();
    }, [carregarDados, itemEstoqueId, navigate]);

    const houveMudanca = itemAtivo && (
        itemAtivo.descricao !== formEdicao.descricao ||
        itemAtivo.espacoId !== formEdicao.espacoId ||
        itemAtivo.tipoUnidadeMedida != formEdicao.tipoUnidadeMedida ||
        parseQuantity(itemAtivo.quantidade) !== parseQuantity(formEdicao.quantidade)
    );

    const handleConfirmarEdicao = async () => {
        setErro('');
        setSucesso('');
        setFieldErrors({});

        const payload = criarPayloadItemEstoque({
            unidadeOrganizacionalId,
            formData: formEdicao
        });

        try {
            const response = await atualizarItemEstoque({ token, itemEstoqueId, payload });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setItemAtivo({ ...itemAtivo, ...payload });
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
        setErro('');
        setSucesso('');

        try {
            const response = await excluirItemEstoque({ token, itemEstoqueId });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                setShowDeleteModal(false);
                navigate('/itens-estoque', { replace: true, state: { sucesso: mensagem } });
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
                setShowDeleteModal(false);
            }
        } catch (error) {
            console.error(error);
            setShowDeleteModal(false);
        }
    };

    const handleTransferir = async (event) => {
        event.preventDefault();
        setErro('');
        setSucesso('');

        try {
            const response = await transferirItemEstoque({ token, itemEstoqueId, novoEspacoId, usuarioId });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setShowTransferirModal(false);
                setItemAtivo(prev => ({ ...prev, espacoId: novoEspacoId }));
                setFormEdicao(prev => ({ ...prev, espacoId: novoEspacoId }));
                setNovoEspacoId('');
                carregarHistorico();
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleMovimentar = async (event) => {
        event.preventDefault();
        setErro('');
        setSucesso('');
        setFieldErrors({});

        const payload = criarPayloadMovimentacao({ movimentacaoData, usuarioId });

        try {
            const response = await movimentarItemEstoque({ token, itemEstoqueId, payload });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setShowMovimentarModal(false);

                carregarHistorico();
                const novaQtde = payload.tipoMovimentacao === 1
                    ? parseQuantity(itemAtivo.quantidade) + payload.quantidade
                    : parseQuantity(itemAtivo.quantidade) - payload.quantidade;

                setItemAtivo(prev => ({ ...prev, quantidade: novaQtde }));
                setFormEdicao(prev => ({ ...prev, quantidade: formatQuantityInput(novaQtde) }));
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

    const abrirMovimentacao = (tipoMovimentacao) => {
        setMovimentacaoData({ tipoMovimentacao, quantidadeMovimento: '' });
        setShowMovimentarModal(true);
        setFieldErrors({});
    };

    const messageModal = (erro || sucesso) && (
        <MessageModal
            type={erro ? 'error' : 'success'}
            message={erro || sucesso}
            onClose={() => { setErro(''); setSucesso(''); }}
            autoClose={8000}
        />
    );

    if (loading || !itemAtivo) {
        return (
            <div className="detail-view w-full">
                <div className="detail-heading">
                    <h2 className="no-margin">Detalhes do Item</h2>
                </div>
                <LoadingWaves variant="list" rows={1} label="Carregando item" />
                {messageModal}
            </div>
        );
    }

    return (
        <ItemEstoqueDetail
            espacos={espacos}
            fieldErrors={fieldErrors}
            formEdicao={formEdicao}
            historico={historico}
            houveMudanca={houveMudanca}
            itemAtivo={itemAtivo}
            loadingHistorico={loadingHistorico}
            movimentacaoData={movimentacaoData}
            novoEspacoId={novoEspacoId}
            onAbrirMovimentacao={abrirMovimentacao}
            onChangeFormEdicao={setFormEdicao}
            onChangeMovimentacao={setMovimentacaoData}
            onChangeNovoEspaco={setNovoEspacoId}
            onCloseDelete={() => setShowDeleteModal(false)}
            onCloseMovimentar={() => setShowMovimentarModal(false)}
            onCloseTransferir={() => setShowTransferirModal(false)}
            onConfirmarEdicao={handleConfirmarEdicao}
            onExcluir={handleExcluir}
            onOpenDelete={() => setShowDeleteModal(true)}
            onOpenTransferir={() => {
                setNovoEspacoId('');
                setShowTransferirModal(true);
            }}
            onSubmitMovimentar={handleMovimentar}
            onSubmitTransferir={handleTransferir}
            onVoltar={() => navigate('/itens-estoque')}
            showDeleteModal={showDeleteModal}
            showMovimentarModal={showMovimentarModal}
            showTransferirModal={showTransferirModal}
            messageModal={messageModal}
        />
    );
}