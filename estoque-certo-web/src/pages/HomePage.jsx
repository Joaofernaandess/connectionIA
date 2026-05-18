import React, { useState, useEffect } from 'react';
import { parseJwt } from '../utils/jwt';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';
import EspacoView from '../components/EspacoView';
import ItemEstoqueView from '../components/ItemEstoqueView';
import ThemeToggle from '../components/ThemeToggle';
import ValidarUsuariosView from '../components/ValidarUsuariosView';

export default function HomePage({ token, onLogout }) {
    const [view, setView] = useState('home');
    const [usuarioId, setUsuarioId] = useState('');
    const [formData, setFormData] = useState({ nome: '', username: '', senha: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const isIOS = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
};

    useEffect(() => {
        const decoded = parseJwt(token);
        if (decoded) {
            const id = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid || '';
            const uname = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || '';
            const uoId = decoded.UnidadeOrganizacionalId || '';
            const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || '';

            if (role === 'Admin') {
                setIsAdmin(true);
            }

            setUsuarioId(id);
            setFormData(prev => ({ ...prev, username: uname, unidadeOrganizacionalId: uoId }));
        }
    }, [token]);

    const handleUpdateData = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setFieldErrors({});

        const payload = {
            ...formData,
            unidadeOrganizacionalId: formData.unidadeOrganizacionalId === '' ? null : formData.unidadeOrganizacionalId
        };

        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/usuarios/${usuarioId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSucesso('Dados atualizados com sucesso!');
            } else if (response.status === 400) {
                const errorData = await response.json();
                const mappedErrors = {};

                if (Array.isArray(errorData)) {
                    errorData.forEach(err => {
                        const fieldName = err.field || err.Field;
                        if (fieldName) mappedErrors[fieldName] = err.error || err.Error;
                    });
                } else if (errorData.errors) {
                    Object.keys(errorData.errors).forEach(key => {
                        const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
                        mappedErrors[fieldName] = errorData.errors[key][0];
                    });
                }
                setFieldErrors(mappedErrors);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro de comunicação com o servidor.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', margin: 0, padding: 0, width: '100%' }}>
            <input type="checkbox" id="menu-toggle" className="sidebar-checkbox" />

            <header style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label htmlFor="menu-toggle" className="button button-outline" style={{ margin: 0, cursor: 'pointer', padding: '0.5rem 1.5rem' }}>
                        ☰ Menu
                    </label>
                    <h3 style={{ margin: '0 0 0 1.5rem', color: 'var(--zf-accent)' }}>Estoque Certo</h3>
                </div>

                <ThemeToggle fixo={false} />
            </header>

            <div className="sidebar-overlay">
                <label htmlFor="menu-toggle" style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}></label>
            </div>

            <aside className="sidebar" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', left: 0, margin: 0 }}>
                <div style={{ padding: '4rem 1.5rem 2rem 1.5rem', flexGrow: 1 }}>
                    <h3 style={{ color: 'var(--zf-accent)', marginTop: 0 }}>Zênite Painel</h3>
                    <p>Menu de navegação</p>
                    <div className="sidebar-nav">
                        <label htmlFor="menu-toggle" onClick={() => setView('home')} className={view === 'home' ? 'active' : ''} style={{ cursor: 'pointer', display: 'block', marginBottom: '0.5rem' }}>Início</label>
                        <label htmlFor="menu-toggle" onClick={() => setView('espacos')} className={view === 'espacos' ? 'active' : ''} style={{ cursor: 'pointer', display: 'block', marginBottom: '0.5rem' }}>Espaços</label>
                        <label htmlFor="menu-toggle" onClick={() => setView('itens-estoque')} className={view === 'itens-estoque' ? 'active' : ''} style={{ cursor: 'pointer', display: 'block', marginBottom: '0.5rem' }}>Itens de Estoque</label>
                        <label htmlFor="menu-toggle" onclick={() => { 
                            if (isIos()){ setView('ios-install');} 
                            else {
                                //andriod install
                            } 
                        }}
                        className={view === 'ios-install' ? 'active' : ''}
                        style={{ cursor: 'pointer', display: 'block', marginBottom: '0.5rem' }}
                        > Adicionar a tela inicial
                        </label>

                        {isAdmin && (
                            <label htmlFor="menu-toggle" onClick={() => setView('validar-usuarios')} className={view === 'validar-usuarios' ? 'active' : ''} style={{ cursor: 'pointer', display: 'block', marginBottom: '0.5rem' }}>Aprovar Usuários</label>
                        )}
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    <div className="sidebar-nav" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="menu-toggle" onClick={() => setView('profile')} className={view === 'profile' ? 'active' : ''} style={{ cursor: 'pointer', display: 'block' }}>Alterar Meus Dados</label>
                    </div>

                    <label htmlFor="menu-toggle" className="button button-outline" style={{ width: '100%', textAlign: 'center', cursor: 'pointer', marginBottom: '0.5rem' }}>
                        Fechar Menu
                    </label>
                    <button onClick={() => setShowLogoutModal(true)} className="button" style={{ width: '100%', backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}>
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            <main className="container" style={{ padding: '3rem 2rem', flexGrow: 1 }}>
                {view === 'home' && (
                    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                        <h1 style={{ fontSize: '3rem' }}>Homepage Zenite</h1>
                        <p>Bem-vindo ao sistema de gestão Estoque Certo. Selecione uma opção no menu lateral.</p>
                    </div>
                )}

                {view === 'espacos' && (
                    <EspacoView token={token} unidadeOrganizacionalId={formData.unidadeOrganizacionalId} />
                )}

                {view === 'itens-estoque' && (
                    <ItemEstoqueView token={token} unidadeOrganizacionalId={formData.unidadeOrganizacionalId} usuarioId={usuarioId} />
                )}

                {view === 'validar-usuarios' && isAdmin && (
                    <ValidarUsuariosView token={token} />
                )}

                {view === 'ios-install' && (
                      <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
                        <h3 style={{ marginTop: 0 }}>Instale o Estoque Certo</h3>

                        <p>
                        Para instalar o aplicativo, toque em <b>Compartilhar</b> e depois em <b>"Adicionar à Tela de Início"</b>.
                        </p>

                        <img
                        src="/tutorial-ios.gif"
                        alt="Tutorial de instalação"
                        style={{ width: '100%', borderRadius: '12px', marginBottom: '16px' }}
                        />

                        <button
                        onClick={() => setView('home')}
                        style={{
                            marginBottom: '1rem',
                            cursor: 'pointer',
                            padding: '12px 24px',
                            fontSize: '18px',
                            borderRadius: '8px'
                        }}
                        className="button"
                        >
                        Entendi
                        </button>
                    </div>
                    )}

                {view === 'profile' && (
                    <div className="zf-row" style={{ justifyContent: 'center' }}>
                        <div className="zf-col-xs-12 zf-col-md-8 zf-col-lg-6 zf-col-xl-5">
                            <div className="card" style={{ width: '100%', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '2rem' }}>
                                    <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Alterar Meus Dados</h2>

                                    {erro && <div className="alert alert-error">{erro}</div>}
                                    {sucesso && <div className="alert alert-success">{sucesso}</div>}

                                    <form onSubmit={handleUpdateData} noValidate>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'normal', color: fieldErrors.Nome ? '#ff4444' : 'inherit' }}>
                                                Nome
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nome}
                                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    marginBottom: 0,
                                                    borderColor: fieldErrors.Nome ? '#ff4444' : undefined,
                                                    outlineColor: fieldErrors.Nome ? '#ff4444' : undefined
                                                }}
                                            />
                                            {fieldErrors.Nome && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px', textAlign: 'left' }}>{fieldErrors.Nome}</small>}
                                        </div>

                                        <PhoneInput
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            error={!!fieldErrors.Username}
                                            errorMessage={fieldErrors.Username}
                                        />

                                        <PasswordInput
                                            label="Nova Senha"
                                            placeholder="Senha"
                                            value={formData.senha}
                                            onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                            error={!!fieldErrors.Senha}
                                            errorMessage={fieldErrors.Senha}
                                        />

                                        <UnidadeComboBox
                                            value={formData.unidadeOrganizacionalId}
                                            onChange={val => setFormData({ ...formData, unidadeOrganizacionalId: val })}
                                            error={!!fieldErrors.UnidadeOrganizacionalId}
                                            errorMessage={fieldErrors.UnidadeOrganizacionalId}
                                        />

                                        <button type="submit" className="button" style={{ width: '100%', marginTop: '1rem' }}>Salvar Alterações</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {showLogoutModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem', boxSizing: 'border-box'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', height: 'fit-content', margin: 'auto', textAlign: 'center', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '2rem' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--zf-text-h)' }}>Sair do Sistema</h2>
                            <p style={{ marginBottom: '2rem', color: 'var(--zf-text-main)' }}>Tem certeza que deseja encerrar a sua sessão?</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="button button-outline" style={{ flex: 1 }} onClick={() => setShowLogoutModal(false)}>Cancelar</button>
                                <button type="button" className="button" style={{ flex: 1, backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }} onClick={onLogout}>Sair</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}