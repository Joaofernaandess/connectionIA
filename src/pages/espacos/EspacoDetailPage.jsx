import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingWaves from '../../components/LoadingWaves';
import MessageModal from '../../components/MessageModal';
import EspacoDetail from '../../components/espacos/EspacoDetail';
import {
    atualizarEspaco,
    excluirEspaco,
    listarItensDoEspaco,
    obterEspaco
} from '../../services/espacoService';
import { atualizarItemEstoque } from '../../services/itemEstoqueService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../../utils/apiUtils';
import { criarPayloadEspaco } from '../../utils/espacoViewModel';
import { formatQuantityInput, maskQuantityInput, parseQuantity } from '../../utils/quantity';

export default function EspacoDetailPage({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const { espacoId } = useParams();

    const [espacoSelecionado, setEspacoSelecionado] = useState(null);
    const [formEdicao, setFormEdicao] = useState({ nome: '', descricao: '' });
    const [itensDoEspaco, setItensDoEspaco] = useState([]);
    const [quantidadesEditadas, setQuantidadesEditadas] = useState({});
    const [salvandoItemId, setSalvandoItemId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingItens, setLoadingItens] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const carregarItens = useCallback(async () => {
        if (!espacoId) return;

        setLoadingItens(true);
        try {
            const response = await listarItensDoEspaco({ token, espacoId });

            if (response.ok) {
                const itens = await response.json();
                setItensDoEspaco(itens);
                setQuantidadesEditadas(Object.fromEntries(
                    itens.map(item => [item.itemEstoqueId, formatQuantityInput(item.quantidade)])
                ));
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

            if (response.ok) {
                const espaco = await response.json();
                setEspacoSelecionado(espaco);
                setFormEdicao({ nome: espaco.nome, descricao: espaco.descricao || '' });
                carregarItens();
            } else {
                const mensagem = await extrairErro(response);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, espacoId, carregarItens]);

    useEffect(() => {
        if (!espacoId) {
            navigate('/espacos', { replace: true });
            return;
        }

        carregarEspaco();
    }, [carregarEspaco, espacoId, navigate]);

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
                if (mensagem) setSucesso(mensagem);
                setEspacoSelecionado({ ...espacoSelecionado, nome: formEdicao.nome, descricao: formEdicao.descricao });
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

    const handleExcluirEspaco = async () => {
        setErro('');
        setSucesso('');

        try {
            const response = await excluirEspaco({ token, espacoId });

            if (response.ok || response.status === 204) {
                const mensagem = await extrairMensagem(response);
                setShowDeleteModal(false);
                navigate('/espacos', { replace: true, state: { sucesso: mensagem } });
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

    const handleQuantidadeItemChange = (itemId, value) => {
        setQuantidadesEditadas(prev => ({
            ...prev,
            [itemId]: maskQuantityInput(value)
        }));
    };

    const handleSalvarQuantidadeItem = async (item) => {
        setErro('');
        setSucesso('');
        setSalvandoItemId(item.itemEstoqueId);

        const novaQuantidade = parseQuantity(quantidadesEditadas[item.itemEstoqueId]);
        const payload = {
            unidadeOrganizacionalId,
            espacoId: item.espacoId || espacoId,
            descricao: item.descricao,
            tipoUnidadeMedida: parseInt(item.tipoUnidadeMedida),
            quantidade: novaQuantidade
        };

        try {
            const response = await atualizarItemEstoque({ token, itemEstoqueId: item.itemEstoqueId, payload });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                setItensDoEspaco(prev => prev.map(atual =>
                    atual.itemEstoqueId === item.itemEstoqueId
                        ? { ...atual, quantidade: novaQuantidade }
                        : atual
                ));
                setQuantidadesEditadas(prev => ({
                    ...prev,
                    [item.itemEstoqueId]: formatQuantityInput(novaQuantidade)
                }));
                if (mensagem) setSucesso(mensagem);
            } else if (response.status === 400) {
                await aplicarErrosCampos(response, setFieldErrors, setErro);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSalvandoItemId(null);
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

    if (loading || !espacoSelecionado) {
        return (
            <div className="detail-view w-full">
                <div className="detail-heading">
                    <h2 className="no-margin">Detalhes do Espaço</h2>
                </div>
                <LoadingWaves variant="list" rows={1} label="Carregando espaço" />
                {messageModal}
            </div>
        );
    }

    return (
        <EspacoDetail
            fieldErrors={fieldErrors}
            formEdicao={formEdicao}
            houveMudanca={houveMudanca}
            itensDoEspaco={itensDoEspaco}
            loadingItens={loadingItens}
            messageModal={messageModal}
            onChangeFormEdicao={setFormEdicao}
            onCloseDelete={() => setShowDeleteModal(false)}
            onConfirmarEdicao={handleConfirmarEdicao}
            onExcluir={handleExcluirEspaco}
            onOpenDelete={() => setShowDeleteModal(true)}
            onQuantidadeItemChange={handleQuantidadeItemChange}
            onSalvarQuantidadeItem={handleSalvarQuantidadeItem}
            onVoltar={() => navigate('/espacos')}
            quantidadesEditadas={quantidadesEditadas}
            salvandoItemId={salvandoItemId}
            showDeleteModal={showDeleteModal}
        />
    );
}