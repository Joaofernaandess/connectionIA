import React, { useState, useEffect, useCallback } from 'react';
import { extrairErro } from '../utils/apiUtils';

const TIPO_UNIDADE = {
    1: 'Unidades (UN)',
    2: 'Quilogramas (KG)',
    3: 'Litros (L)',
    4: 'Caixas (CX)'
};

export default function EspacoView({ token, unidadeOrganizacionalId }) {

    const [viewMode, setViewMode] = useState('list');
    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const [showModalNovo, setShowModalNovo] = useState(false);
    const [formDataNovo, setFormDataNovo] = useState({ nome: '', descricao: '' });

    const [espacoSelecionado, setEspacoSelecionado] = useState(null);
    const [formEdicao, setFormEdicao] = useState({ nome: '', descricao: '' });
    const [itensDoEspaco, setItensDoEspaco] = useState([]);
    const [loadingItens, setLoadingItens] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const carregarEspacos = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;
        setLoading(true);
        setErro('');
        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/espacos?unidadeOrganizacionalId=${unidadeOrganizacionalId}&top=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEspacos(data);
            } else {
                setErro('Falha ao carregar os espaços.');
            }
        } catch (err) {
            setErro('Erro de comunicação com o servidor.');
        } finally {
            setLoading(false);
        }
    }, [token, unidadeOrganizacionalId]);

    useEffect(() => {
        carregarEspacos();
    }, [carregarEspacos]);

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

    const handleCriarEspaco = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            nome: formDataNovo.nome,
            descricao: formDataNovo.descricao
        };

        try {
            const response = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/espacos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowModalNovo(false);
                setSucesso('Espaço cadastrado com sucesso.');
                carregarEspacos();
            } else if (response.status === 400) {
                await parseBackendErrors(response);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro de conexão com o servidor.');
        }
    };

    const abrirDetalhes = async (espaco) => {
        setEspacoSelecionado(espaco);
        setFormEdicao({ nome: espaco.nome, descricao: espaco.descricao || '' });
        setViewMode('detail');
        setErro(''); setSucesso(''); setFieldErrors({});

        setLoadingItens(true);
        try {
            const res = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque?espacoId=${espaco.espacoId}&top=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setItensDoEspaco(await res.json());
            }
        } catch (err) {
            setErro('Erro ao carregar os itens deste espaço.');
        } finally {
            setLoadingItens(false);
        }
    };

    const voltarParaLista = () => {
        setViewMode('list');
        setEspacoSelecionado(null);
        setErro(''); setSucesso(''); setFieldErrors({});
        carregarEspacos();
    };

    const houveMudanca = espacoSelecionado && (
        espacoSelecionado.nome !== formEdicao.nome ||
        (espacoSelecionado.descricao || '') !== formEdicao.descricao
    );

    const handleConfirmarEdicao = async () => {
        setErro(''); setSucesso(''); setFieldErrors({});
        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            nome: formEdicao.nome,
            descricao: formEdicao.descricao
        };

        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/espacos/${espacoSelecionado.espacoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSucesso('Espaço atualizado com sucesso.');
                setEspacoSelecionado({ ...espacoSelecionado, nome: formEdicao.nome, descricao: formEdicao.descricao });
            } else if (response.status === 400) {
                await parseBackendErrors(response);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro de conexão com o servidor.');
        }
    };

    const handleExcluirEspaco = async () => {
        setErro(''); setSucesso('');
        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/espacos/${espacoSelecionado.espacoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok || response.status === 204) {
                setShowDeleteModal(false);
                voltarParaLista();
                setTimeout(() => setSucesso('Espaço excluído com sucesso.'), 100);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
                setShowDeleteModal(false);
            }
        } catch (error) {
            setErro('Erro de conexão com o servidor.');
            setShowDeleteModal(false);
        }
    };

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999, padding: '1rem', boxSizing: 'border-box'
    };

    if (viewMode === 'list') {
        return (
            <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0 }}>Gestão de Espaços</h2>
                    <button className="button" onClick={() => { setFormDataNovo({ nome: '', descricao: '' }); setShowModalNovo(true); setFieldErrors({}); setErro(''); }}>+ Novo Espaço</button>
                </div>

                {erro && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{erro}</div>}
                {sucesso && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{sucesso}</div>}

                {loading ? (
                    <p>Carregando espaços...</p>
                ) : espacos.length === 0 ? (
                    <div className="card" style={{ backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                            <p style={{ color: 'var(--zf-text-main)', margin: 0 }}>Nenhum espaço cadastrado nesta unidade.</p>
                        </div>
                    </div>
                ) : (
                    <div className="zf-row">
                        {espacos.map(espaco => (
                            <div key={espaco.espacoId} className="zf-col-xs-12 zf-col-md-6 zf-col-lg-4 zf-col-xl-3" style={{ marginBottom: '1rem' }}>
                                <div className="card" style={{ height: '100%', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--zf-text-h)' }}>{espaco.nome}</h3>
                                        <p style={{ color: 'var(--zf-text-main)', flexGrow: 1, fontSize: '0.9rem' }}>
                                            {espaco.descricao || 'Sem descrição'}
                                        </p>
                                        <button className="button button-outline" style={{ width: '100%', marginTop: '1rem' }} onClick={() => abrirDetalhes(espaco)}>
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
                        <div className="card" style={{ width: '100%', maxWidth: '500px', height: 'fit-content', margin: 'auto', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '2rem' }}>
                                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', color: 'var(--zf-text-h)' }}>Novo Espaço</h2>
                                <form onSubmit={handleCriarEspaco} noValidate>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.Nome ? '#ff4444' : 'inherit' }}>Nome do Espaço (Obrigatório)</label>
                                        <input
                                            type="text"
                                            value={formDataNovo.nome}
                                            onChange={e => setFormDataNovo({ ...formDataNovo, nome: e.target.value })}
                                            style={{ width: '100%', borderColor: fieldErrors.Nome ? '#ff4444' : undefined, outlineColor: fieldErrors.Nome ? '#ff4444' : undefined }}
                                        />
                                        {fieldErrors.Nome && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Nome}</small>}
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.Descricao ? '#ff4444' : 'inherit' }}>Descrição (Opcional)</label>
                                        <input
                                            type="text"
                                            value={formDataNovo.descricao}
                                            onChange={e => setFormDataNovo({ ...formDataNovo, descricao: e.target.value })}
                                            style={{ width: '100%', borderColor: fieldErrors.Descricao ? '#ff4444' : undefined, outlineColor: fieldErrors.Descricao ? '#ff4444' : undefined }}
                                        />
                                        {fieldErrors.Descricao && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Descricao}</small>}
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
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Detalhes do Espaço</h2>
                <button className="button button-outline" onClick={voltarParaLista}>← Voltar</button>
            </div>

            {erro && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{erro}</div>}
            {sucesso && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{sucesso}</div>}

            <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem' }}>
                    <div className="zf-row">
                        <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1rem' }}>
                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.Nome ? '#ff4444' : 'inherit' }}>Nome do Espaço</label>
                            <input
                                type="text"
                                value={formEdicao.nome}
                                onChange={e => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                                style={{ width: '100%', marginBottom: 0, borderColor: fieldErrors.Nome ? '#ff4444' : undefined, outlineColor: fieldErrors.Nome ? '#ff4444' : undefined }}
                            />
                            {fieldErrors.Nome && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Nome}</small>}
                        </div>
                        <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1rem' }}>
                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.Descricao ? '#ff4444' : 'inherit' }}>Descrição</label>
                            <input
                                type="text"
                                value={formEdicao.descricao}
                                onChange={e => setFormEdicao({ ...formEdicao, descricao: e.target.value })}
                                style={{ width: '100%', marginBottom: 0, borderColor: fieldErrors.Descricao ? '#ff4444' : undefined, outlineColor: fieldErrors.Descricao ? '#ff4444' : undefined }}
                            />
                            {fieldErrors.Descricao && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Descricao}</small>}
                        </div>
                    </div>
                </div>
            </div>

            <h3 style={{ color: 'var(--zf-text-h)', marginBottom: '1rem' }}>Itens neste espaço</h3>
            {loadingItens ? (
                <p>Carregando inventário...</p>
            ) : itensDoEspaco.length === 0 ? (
                <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                    <div style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                        <p style={{ color: 'var(--zf-text-main)', margin: 0 }}>Este espaço está vazio.</p>
                    </div>
                </div>
            ) : (
                <div className="zf-row" style={{ marginBottom: '2rem' }}>
                    {itensDoEspaco.map(item => (
                        <div key={item.itemEstoqueId} className="zf-col-xs-12 zf-col-md-6 zf-col-lg-4" style={{ marginBottom: '1rem' }}>
                            <div className="card" style={{ backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--zf-text-h)' }}>{item.descricao}</h4>
                                        <small style={{ color: 'var(--zf-text-main)' }}>{TIPO_UNIDADE[item.tipoUnidadeMedida] || 'UN'}</small>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--zf-accent)', color: 'var(--zf-accent-text)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                        {parseFloat(item.quantidade)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                <button
                    className="button"
                    onClick={handleConfirmarEdicao}
                    disabled={!houveMudanca}
                    style={{ flex: 1, opacity: !houveMudanca ? 0.5 : 1, cursor: !houveMudanca ? 'not-allowed' : 'pointer' }}
                >
                    Confirmar Edição
                </button>
                <button
                    className="button"
                    onClick={() => setShowDeleteModal(true)}
                    style={{ flex: 1, backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                >
                    Excluir Espaço
                </button>
            </div>

            {/*modal excluir*/}
            {showDeleteModal && (
                <div style={overlayStyle}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', height: 'fit-content', margin: 'auto', textAlign: 'center', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '2rem' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--zf-text-h)' }}>Excluir Espaço</h2>
                            <p style={{ marginBottom: '2rem', color: 'var(--zf-text-main)' }}>
                                Tem certeza que deseja excluir este espaço? Se houver itens de estoque na lista acima, a exclusão será bloqueada pelo banco de dados.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="button button-outline" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                                <button type="button" className="button" style={{ flex: 1, backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }} onClick={handleExcluirEspaco}>Excluir Definitivo</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}