import React, { useState, useEffect, useCallback } from 'react';
import { extrairErro } from '../utils/apiUtils';
import { formatQuantity, formatQuantityInput, maskQuantityInput, parseQuantity } from '../utils/quantity';
import LoadingWaves from './LoadingWaves';
import MessageModal from './MessageModal';

const TIPO_UNIDADE = {
    1: 'Quilos (KG)',
    2: 'Gramas (G)',
    3: 'Miligramas (MG)',
    4: 'Litros (L)',
    5: 'Mililitros (ML)',
    6: 'Unidades (UN)'
};

export default function ItemEstoqueView({ token, unidadeOrganizacionalId, usuarioId }) {
    const [viewMode, setViewMode] = useState('list');
    const [itens, setItens] = useState([]);
    const [espacos, setEspacos] = useState([]);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingHistorico, setLoadingHistorico] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [pesquisa, setPesquisa] = useState('');

    //modais
    const [showModalNovo, setShowModalNovo] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMovimentarModal, setShowMovimentarModal] = useState(false);
    const [showTransferirModal, setShowTransferirModal] = useState(false);
    const [novoEspacoId, setNovoEspacoId] = useState('');

    const [itemAtivo, setItemAtivo] = useState(null);
    const [formDataNovo, setFormDataNovo] = useState({ espacoId: '', descricao: '', tipoUnidadeMedida: 6, quantidade: '' });
    const [formEdicao, setFormEdicao] = useState({ espacoId: '', descricao: '', tipoUnidadeMedida: 6, quantidade: '' });
    const [movimentacaoData, setMovimentacaoData] = useState({ tipoMovimentacao: 1, quantidadeMovimento: '' });

    const getDataCadastro = (item) => (
        item.dataCadastro ||
        item.dataCriacao ||
        item.criadoEm ||
        item.createdAt ||
        item.dataHoraCadastro ||
        ''
    );

    const ordenarItens = (lista) => [...lista].sort((a, b) => {
        const espacoCompare = String(a.espacoId || '').localeCompare(String(b.espacoId || ''));
        if (espacoCompare !== 0) return espacoCompare;

        const dataA = new Date(getDataCadastro(a)).getTime() || 0;
        const dataB = new Date(getDataCadastro(b)).getTime() || 0;
        return dataB - dataA;
    });

    const filtrarItensLocalmente = (lista, termo, listaEspacos) => {
        const termoNormalizado = termo.trim().toLowerCase();
        if (!termoNormalizado) return lista;

        return lista.filter(item => {
            const espaco = listaEspacos.find(e => e.espacoId === item.espacoId);
            return [
                item.descricao,
                item.espacoId,
                espaco?.nome,
                espaco?.descricao,
                TIPO_UNIDADE[item.tipoUnidadeMedida]
            ].some(valor => String(valor || '').toLowerCase().includes(termoNormalizado));
        });
    };

    const carregarDados = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;
        setLoading(true);
        setErro('');
        try {
            const paramsItens = new URLSearchParams({
                unidadeOrganizacionalId,
                skip: '0',
                top: '50'
            });

            if (pesquisa.trim()) {
                paramsItens.set('filtro', pesquisa.trim());
            }

            const resItens = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque?${paramsItens.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resEspacos = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/espacos?unidadeOrganizacionalId=${unidadeOrganizacionalId}&top=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resItens.ok && resEspacos.ok) {
                const itensRecebidos = await resItens.json();
                const espacosRecebidos = await resEspacos.json();
                const itensFiltrados = filtrarItensLocalmente(itensRecebidos, pesquisa, espacosRecebidos);

                setItens(ordenarItens(itensFiltrados));
                setEspacos(espacosRecebidos);
            } else {
                setErro('Falha ao carregar os dados do estoque.');
            }
        } catch (err) {
            setErro('Erro de comunicação com o servidor.');
        } finally {
            setLoading(false);
        }
    }, [token, unidadeOrganizacionalId, pesquisa]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const carregarHistorico = async (id) => {
        setLoadingHistorico(true);
        try {
            const res = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${id}/historico`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setHistorico(await res.json());
            }
        } catch (err) {

        } finally {
            setLoadingHistorico(false);
        }
    };

    const parseBackendErrors = async (res) => {
        try {
            const text = await res.text();
            if (!text) return;
            const errorData = JSON.parse(text);
            const mappedErrors = {};
            if (Array.isArray(errorData)) {
                errorData.forEach(err => {
                    const fieldName = err.field || err.Field;
                    if (fieldName) mappedErrors[fieldName] = err.error || err.Error;
                });
            } else if (errorData.errors) {
                Object.keys(errorData.errors).forEach(key => {
                    let cleanKey = key.replace('$.', '');
                    const fieldName = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
                    mappedErrors[fieldName] = errorData.errors[key][0];
                });
            }
            setFieldErrors(mappedErrors);
        } catch (e) {
            setErro('Verifique os campos preenchidos e tente novamente.');
        }
    };

    const abrirDetalhes = (item) => {
        setItemAtivo(item);
        setFormEdicao({
            espacoId: item.espacoId || '',
            descricao: item.descricao || '',
            tipoUnidadeMedida: item.tipoUnidadeMedida || 1,
            quantidade: formatQuantityInput(item.quantidade || 0)
        });
        setViewMode('detail');
        setErro(''); setSucesso(''); setFieldErrors({});
        carregarHistorico(item.itemEstoqueId);
    };

    const voltarParaLista = () => {
        setViewMode('list');
        setItemAtivo(null);
        setErro(''); setSucesso(''); setFieldErrors({});
        carregarDados();
    };

    const handleCriar = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            espacoId: formDataNovo.espacoId === '' ? '00000000-0000-0000-0000-000000000000' : formDataNovo.espacoId,
            descricao: formDataNovo.descricao,
            tipoUnidadeMedida: parseInt(formDataNovo.tipoUnidadeMedida),
            quantidade: formDataNovo.quantidade === '' ? 0 : parseQuantity(formDataNovo.quantidade)
        };

        try {
            const response = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowModalNovo(false);
                setSucesso('Item cadastrado com sucesso.');
                carregarDados();
            } else if (response.status === 400) {
                await parseBackendErrors(response);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) { setErro('Erro de conexão com o servidor.'); }
    };

    const houveMudanca = itemAtivo && (
        itemAtivo.descricao !== formEdicao.descricao ||
        itemAtivo.espacoId !== formEdicao.espacoId ||
        itemAtivo.tipoUnidadeMedida != formEdicao.tipoUnidadeMedida ||
        parseQuantity(itemAtivo.quantidade) !== parseQuantity(formEdicao.quantidade)
    );

    const handleConfirmarEdicao = async () => {
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            espacoId: formEdicao.espacoId === '' ? '00000000-0000-0000-0000-000000000000' : formEdicao.espacoId,
            descricao: formEdicao.descricao,
            tipoUnidadeMedida: parseInt(formEdicao.tipoUnidadeMedida),
            quantidade: parseQuantity(formEdicao.quantidade)
        };

        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${itemAtivo.itemEstoqueId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSucesso('Item atualizado com sucesso.');
                setItemAtivo({ ...itemAtivo, ...payload });
            } else if (response.status === 400) {
                await parseBackendErrors(response);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) { setErro('Erro de conexão com o servidor.'); }
    };

    const handleExcluir = async () => {
        setErro(''); setSucesso('');
        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${itemAtivo.itemEstoqueId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setShowDeleteModal(false);
                voltarParaLista();
                setTimeout(() => setSucesso('Item excluído com sucesso.'), 100);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
                setShowDeleteModal(false);
            }
        } catch (error) { setErro('Erro de conexão.'); setShowDeleteModal(false); }
    };

    const handleTransferir = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        if (!novoEspacoId) {
            setErro('Selecione o novo espaço de destino.');
            return;
        }

        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${itemAtivo.itemEstoqueId}/transferir`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ novoEspacoId })
            });

            if (response.ok) {
                setSucesso('Item transferido com sucesso!');
                setShowTransferirModal(false);

                // Atualiza na lista geral
                setItens(prev => prev.map(item =>
                    item.itemEstoqueId === itemAtivo.itemEstoqueId
                        ? { ...item, espacoId: novoEspacoId }
                        : item
                ));

                // Atualiza o item ativo e o form na tela de detalhes
                setItemAtivo(prev => ({ ...prev, espacoId: novoEspacoId }));
                setFormEdicao(prev => ({ ...prev, espacoId: novoEspacoId }));

                setNovoEspacoId('');
            } else {
                setErro(await extrairErro(response));
            }
        } catch (error) {
            setErro('Erro ao tentar transferir o item de espaço.');
        }
    };

    const handleMovimentar = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso(''); setFieldErrors({});

        const quantidadeMovimento = parseQuantity(movimentacaoData.quantidadeMovimento);
        if (!movimentacaoData.quantidadeMovimento || quantidadeMovimento <= 0) {
            setFieldErrors({ QuantidadeMovimento: 'Informe uma quantidade maior que zero.' });
            return;
        }

        const payload = {
            quantidade: quantidadeMovimento,
            tipoMovimentacao: parseInt(movimentacaoData.tipoMovimentacao),
            usuarioId: usuarioId || '00000000-0000-0000-0000-000000000000'
        };

        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${itemAtivo.itemEstoqueId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSucesso('Movimentação realizada com sucesso!');
                setShowMovimentarModal(false);

                carregarHistorico(itemAtivo.itemEstoqueId);
                const novaQtde = payload.tipoMovimentacao === 1
                    ? parseQuantity(itemAtivo.quantidade) + payload.quantidade
                    : parseQuantity(itemAtivo.quantidade) - payload.quantidade;

                setItemAtivo(prev => ({ ...prev, quantidade: novaQtde }));
                setFormEdicao(prev => ({ ...prev, quantidade: formatQuantityInput(novaQtde) }));

            } else if (response.status === 400) {
                await parseBackendErrors(response);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) { setErro('Erro de conexão.'); }
    };

    const getNomeEspaco = (id) => {
        const espaco = espacos.find(e => e.espacoId === id);
        return espaco ? espaco.nome : 'Espaço Desconhecido';
    };

    const abrirMovimentacao = (tipoMovimentacao) => {
        setMovimentacaoData({ tipoMovimentacao, quantidadeMovimento: '' });
        setShowMovimentarModal(true);
        setFieldErrors({});
    };

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999, padding: '1.5rem', boxSizing: 'border-box'
    };

    const getInputBaseStyle = (isError) => ({
        width: '100%', marginBottom: 0, borderColor: isError ? '#e99292' : undefined, outlineColor: isError ? '#e99292' : undefined
    });

    if (viewMode === 'list') {
        return (
            <div style={{ width: '100%' }}>
                <div className="inventory-list-header">
                    <h2 style={{ margin: 0 }}>Itens de Estoque</h2>
                    <button className="button inventory-list-header-action" style={{ margin: 0 }} onClick={() => { setFormDataNovo({ espacoId: espacos.length > 0 ? espacos[0].espacoId : '', descricao: '', tipoUnidadeMedida: 6, quantidade: '' }); setShowModalNovo(true); setFieldErrors({}); setErro(''); }}>+ Novo Item</button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Pesquisar itens por descrição..."
                        value={pesquisa}
                        onChange={(e) => setPesquisa(e.target.value)}
                        style={{ width: '100%', marginBottom: 0 }}
                    />
                </div>

                {loading ? (
                    <LoadingWaves rows={3} label="Carregando itens" />
                ) : espacos.length === 0 ? (
                    <div className="alert alert-error">Você precisa cadastrar um Espaço antes de criar Itens.</div>
                ) : itens.length === 0 ? (
                    <div className="card" style={{ backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                            <p style={{ color: 'var(--zf-text-main)', margin: 0 }}>Nenhum item de estoque cadastrado.</p>
                        </div>
                    </div>
                ) : (
                    <div className="inventory-grid inventory-grid-compact">
                        {itens.map(item => (
                            <div key={item.itemEstoqueId} className="inventory-grid-item">
                                <div className="card inventory-card inventory-list-card inventory-item-list-card" style={{
                                    backgroundColor: 'var(--zf-background-secondary)',
                                    borderRadius: '10px',
                                }}>
                                    <div className="inventory-card-header">
                                        <div className="inventory-card-title-row">
                                            <h3 className="inventory-card-title">{item.descricao}</h3>
                                            <span className="inventory-card-badge">
                                                {formatQuantity(item.quantidade)}
                                            </span>
                                        </div>
                                        <p className="inventory-card-description">
                                            Local: {getNomeEspaco(item.espacoId)}
                                        </p>
                                    </div>
                                    <div className="inventory-card-footer">
                                        <button className="button button-outline inventory-card-action" onClick={() => abrirDetalhes(item)}>
                                            Visualizar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showModalNovo && (
                    <div style={overlayStyle}>
                        <div className="card" style={{ width: '100%', maxWidth: '450px', height: 'fit-content', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '2rem' }}>
                                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', color: 'var(--zf-text-h)' }}>Novo Item</h2>
                                <form onSubmit={handleCriar} noValidate>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.Descricao ? '#e99292' : 'inherit' }}>Descrição do Produto</label>
                                        <input type="text" value={formDataNovo.descricao} onChange={e => setFormDataNovo({ ...formDataNovo, descricao: e.target.value })} style={getInputBaseStyle(fieldErrors.Descricao)} />
                                        {fieldErrors.Descricao && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Descricao}</small>}
                                    </div>

                                    <div className="zf-row">
                                        <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1rem' }}>
                                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.EspacoId ? '#e99292' : 'inherit' }}>Local (Espaço)</label>
                                            <select value={formDataNovo.espacoId} onChange={e => setFormDataNovo({ ...formDataNovo, espacoId: e.target.value })} style={getInputBaseStyle(fieldErrors.EspacoId)}>
                                                <option value="" disabled>Selecione...</option>
                                                {espacos.map(e => <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>)}
                                            </select>
                                            {fieldErrors.EspacoId && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.EspacoId}</small>}
                                        </div>
                                        <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1rem' }}>
                                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.TipoUnidadeMedida ? '#e99292' : 'inherit' }}>Unidade de Medida</label>
                                            <select value={formDataNovo.tipoUnidadeMedida} onChange={e => setFormDataNovo({ ...formDataNovo, tipoUnidadeMedida: e.target.value })} style={getInputBaseStyle(fieldErrors.TipoUnidadeMedida)}>
                                                {Object.entries(TIPO_UNIDADE).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                                            </select>
                                            {fieldErrors.TipoUnidadeMedida && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.TipoUnidadeMedida}</small>}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.Quantidade ? '#e99292' : 'inherit' }}>Quantidade Inicial</label>
                                        <input type="text" inputMode="decimal" value={formDataNovo.quantidade} onChange={e => setFormDataNovo({ ...formDataNovo, quantidade: maskQuantityInput(e.target.value) })} style={getInputBaseStyle(fieldErrors.Quantidade)} />
                                        {fieldErrors.Quantidade && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Quantidade}</small>}
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="button" className="button button-outline" style={{ flex: 1 }} onClick={() => setShowModalNovo(false)}>Cancelar</button>
                                        <button type="submit" className="button" style={{ flex: 1 }}>Salvar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="detail-view" style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>Detalhes do Item</h2>
            </div>

            {erro && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{erro}</div>}
            {sucesso && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{sucesso}</div>}

            <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem' }}>
                    <div className="zf-row">
                        <div className="zf-col-xs-12 zf-col-md-4" style={{ marginBottom: '1rem' }}>
                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.Descricao ? '#e99292' : 'inherit' }}>Descrição do Produto</label>
                            <input type="text" value={formEdicao.descricao} onChange={e => setFormEdicao({ ...formEdicao, descricao: e.target.value })} style={getInputBaseStyle(fieldErrors.Descricao)} />
                            {fieldErrors.Descricao && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Descricao}</small>}
                        </div>
                        <div className="zf-col-xs-12 zf-col-md-3" style={{ marginBottom: '1rem' }}>
                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.EspacoId ? '#e99292' : 'inherit' }}>Local (Espaço)</label>
                            <select value={formEdicao.espacoId} onChange={e => setFormEdicao({ ...formEdicao, espacoId: e.target.value })} style={getInputBaseStyle(fieldErrors.EspacoId)}>
                                {espacos.map(e => <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>)}
                            </select>
                            {fieldErrors.EspacoId && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.EspacoId}</small>}
                        </div>
                        <div className="zf-col-xs-12 zf-col-md-3" style={{ marginBottom: '1rem' }}>
                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.TipoUnidadeMedida ? '#e99292' : 'inherit' }}>Unidade</label>
                            <select value={formEdicao.tipoUnidadeMedida} onChange={e => setFormEdicao({ ...formEdicao, tipoUnidadeMedida: e.target.value })} style={getInputBaseStyle(fieldErrors.TipoUnidadeMedida)}>
                                {Object.entries(TIPO_UNIDADE).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                            </select>
                            {fieldErrors.TipoUnidadeMedida && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.TipoUnidadeMedida}</small>}
                        </div>
                        <div className="zf-col-xs-12 zf-col-md-2" style={{ marginBottom: '1rem' }}>
                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--zf-text-main)' }}>Saldo Atual</label>
                            <input type="text" inputMode="decimal" value={formEdicao.quantidade} onChange={e => setFormEdicao({ ...formEdicao, quantidade: maskQuantityInput(e.target.value) })} style={{ width: '100%', marginBottom: 0 }} />
                        </div>
                    </div>
                </div>
            </div>

            <button
                className="button button-outline"
                style={{ width: '100%', marginBottom: '1.5rem' }}
                onClick={() => {
                    setNovoEspacoId('');
                    setShowTransferirModal(true);
                }}
            >
                Transferir item para outro espaço
            </button>

            <div className="stock-movement-actions">
                <button className="button" style={{ margin: 0, width: '100%' }} onClick={() => abrirMovimentacao(1)}>
                    + Entrada
                </button>
                <button className="button" style={{ margin: 0, width: '100%', backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={() => abrirMovimentacao(2)}>
                    - Saída
                </button>
            </div>

            <div className="section-heading">
                <h3 style={{ color: 'var(--zf-text-h)', margin: 0 }}>Histórico de Movimentações</h3>
            </div>

            {loadingHistorico ? (
                <LoadingWaves rows={3} label="Carregando histórico" />
            ) : historico.length === 0 ? (
                <div className="card" style={{ backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
                    <div style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                        <p style={{ color: 'var(--zf-text-main)', margin: 0 }}>Nenhuma movimentação registrada.</p>
                    </div>
                </div>
            ) : (
                <div className="history-grid" style={{ marginBottom: '2rem' }}>
                    {historico.map((hist, index) => {
                        const qtd = Math.abs(hist.quantidadeResultante - hist.quantidadeAnterior);
                        const tipo = hist.tipoMovimentacao;
                        const data = hist.dataHora;

                        const nome = hist.nome || 'Sistema (Sem usuário)';

                        return (
                            <div key={hist.historicoId || index} className="history-grid-item">
                                <div className="card history-card" style={{
                                    backgroundColor: 'var(--zf-background-secondary)',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    borderLeft: `4px solid ${tipo === 1 ? 'var(--zf-accent)' : '#ef4444'}`
                                }}>
                                    <div className="history-card-content">
                                        <div className="history-card-info">
                                            <h4 className="history-card-title">
                                                {tipo === 1 ? 'Entrada (+)' : 'Saída (-)'}
                                            </h4>
                                            <small className="history-card-meta">
                                                Data: {new Date(data).toLocaleString()}
                                            </small>
                                            <small className="history-card-meta">
                                                Responsável: <span style={{ color: 'var(--zf-accent)' }}>{nome}</span>
                                            </small>
                                        </div>
                                        <div className="history-card-amount" style={{ backgroundColor: tipo === 1 ? 'var(--zf-accent)' : '#ef4444', color: tipo === 1 ? 'var(--zf-accent-text)' : '#fff' }}>
                                            {tipo === 1 ? '+' : '-'}{formatQuantity(qtd)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="detail-action-bar">
                <button className="button button-outline" onClick={voltarParaLista}>
                    Voltar
                </button>
                <button
                    className="button"
                    onClick={handleConfirmarEdicao}
                    disabled={!houveMudanca}
                    style={{ opacity: !houveMudanca ? 0.5 : 1, cursor: !houveMudanca ? 'not-allowed' : 'pointer' }}
                >
                    Editar
                </button>
                <button
                    className="button"
                    onClick={() => setShowDeleteModal(true)}
                    style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                >
                    Excluir
                </button>
            </div>

            {showMovimentarModal && (
                <div style={overlayStyle}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', height: 'fit-content', margin: 'auto', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '2rem' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '0.5rem', textAlign: 'center', color: 'var(--zf-text-h)' }}>Movimentar Estoque</h2>
                            <p style={{ textAlign: 'center', color: 'var(--zf-accent)', marginBottom: '1.5rem', fontWeight: 'bold' }}>{itemAtivo?.descricao}</p>

                            <form onSubmit={handleMovimentar} noValidate>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <span style={{ display: 'block', textAlign: 'left', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--zf-text-main)' }}>Operação</span>
                                    <div style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        backgroundColor: movimentacaoData.tipoMovimentacao == 2 ? '#ef44441a' : 'rgba(212, 175, 55, 0.1)',
                                        color: movimentacaoData.tipoMovimentacao == 2 ? '#ef4444' : 'var(--zf-accent)',
                                        border: `1px solid ${movimentacaoData.tipoMovimentacao == 2 ? '#ef4444' : 'var(--zf-accent)'}`,
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    }}>
                                        {movimentacaoData.tipoMovimentacao == 2 ? 'Saída (-)' : 'Entrada (+)'}
                                    </div>
                                    {fieldErrors.TipoMovimentacao && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.TipoMovimentacao}</small>}
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'inherit' }}>Quantidade</label>
                                    <input type="text" inputMode="decimal" value={movimentacaoData.quantidadeMovimento} onChange={e => setMovimentacaoData({ ...movimentacaoData, quantidadeMovimento: maskQuantityInput(e.target.value) })} style={getInputBaseStyle(fieldErrors.QuantidadeMovimento)} />
                                    {fieldErrors.QuantidadeMovimento && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.QuantidadeMovimento}</small>}
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="button button-outline" onClick={() => setShowMovimentarModal(false)}>Cancelar</button>
                                    <button type="submit" className="button" style={{ backgroundColor: movimentacaoData.tipoMovimentacao == 2 ? '#ef4444' : 'var(--zf-accent)', borderColor: movimentacaoData.tipoMovimentacao == 2 ? '#ef4444' : 'var(--zf-accent)', color: movimentacaoData.tipoMovimentacao == 2 ? '#fff' : '#000' }}>Confirmar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div style={overlayStyle}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', height: 'fit-content', margin: 'auto', textAlign: 'center', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '2rem' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--zf-text-h)' }}>Excluir Item</h2>
                            <p style={{ marginBottom: '2rem', color: 'var(--zf-text-main)' }}>Tem certeza que deseja excluir o item de estoque? Todo o histórico de movimentações também será perdido.</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="button button-outline" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                                <button type="button" className="button" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={handleExcluir}>Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showTransferirModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', height: 'fit-content', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: '2rem' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--zf-text-h)' }}>Transferir de Espaço</h2>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--zf-text-main)' }}>
                            Selecione o novo local para o item <strong>{itemAtivo?.descricao}</strong>:
                        </p>

                        <form onSubmit={handleTransferir} noValidate>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Espaço de Destino</label>
                                <select
                                    value={novoEspacoId}
                                    onChange={e => setNovoEspacoId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        borderRadius: '5px',
                                        backgroundColor: 'var(--zf-background)',
                                        color: 'var(--zf-text-main)',
                                        border: '1px solid rgba(212, 175, 55, 0.3)'
                                    }}
                                >
                                    <option value="">Selecione um espaço...</option>
                                    {espacos
                                        .filter(e => e.espacoId !== itemAtivo?.espacoId)
                                        .map(e => (
                                            <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="button button-outline" style={{ flex: 1 }} onClick={() => setShowTransferirModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="button" style={{ flex: 1 }}>
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {(erro || sucesso) && (
               <MessageModal
                    type={erro ? 'error' : 'success'}
                    message={erro || sucesso}
                    onClose={() => { setErro(''); setSucesso(''); }}
                    autoClose={8000}
                />
            )}
        </div>
    );
}
