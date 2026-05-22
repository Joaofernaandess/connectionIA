import React, { useState, useEffect, useCallback } from 'react';
import { extrairErro } from '../utils/apiUtils';
import MessageModal from './MessageModal';

export default function ValidarUsuariosView({ token }) {
    const [usuarios, setUsuarios] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    const carregarUsuariosPendentes = useCallback(async () => {
        setErro('');
        try {
            const response = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/usuarios?valido=false&top=1000', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setUsuarios(await response.json());
            } else {
                setErro('Falha ao carregar usuários pendentes.');
            }
        } catch (err) {
            setErro('Erro de comunicação.');
        }
    }, [token]);

    useEffect(() => {
        carregarUsuariosPendentes();
    }, [carregarUsuariosPendentes]);

    const handleAprovar = async (usuarioId) => {
        setErro(''); setSucesso('');
        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/usuarios/${usuarioId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setSucesso('Usuário aprovado com sucesso!');
                setUsuarios(prev => prev.filter(u => u.usuarioId !== usuarioId));
            } else {
                setErro(await extrairErro(response));
            }
        } catch (error) {
            setErro('Erro ao tentar aprovar usuário.');
        }
    };

    const usuariosFiltrados = usuarios.filter(user => {
        const termo = pesquisa.toLowerCase();
        return (
            user.nome?.toLowerCase().includes(termo) ||
            user.username?.toLowerCase().includes(termo) ||
            user.nomeUnidadeOrganizacional?.toLowerCase().includes(termo)
        );
    });

    return (
        <div style={{ width: '100%' }}>
            <h2 style={{ marginBottom: '2rem' }}>Usuários Pendentes</h2>

            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Pesquisar por nome, telefone ou unidade..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    style={{ width: '100%' }}
                />
            </div>

            {usuariosFiltrados.length === 0 ? (
                <div className="card" style={{ backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <p style={{ color: 'var(--zf-text-main)', margin: 0 }}>
                        {usuarios.length === 0 ? 'Nenhum usuário pendente de validação.' : 'Nenhum resultado encontrado para a pesquisa.'}
                    </p>
                </div>
            ) : (
                <div className="zf-row">
                    {usuariosFiltrados.map(user => (
                        <div key={user.usuarioId} className="zf-col-xs-12 zf-col-md-6 zf-col-lg-4" style={{ marginBottom: '1rem' }}>

                            <div className="card" style={{ backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--zf-text-h)' }}>{user.nome}</h3>

                                <p style={{ color: 'var(--zf-text-main)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                    <strong>Username:</strong> {user.username}
                                </p>

                                <p style={{ color: 'var(--zf-text-main)', fontSize: '0.85rem', marginBottom: '1.5rem', flexGrow: 1 }}>
                                    <strong>Unidade:</strong> {user.nomeUnidadeOrganizacional || 'Sem Unidade'}
                                </p>

                                <button className="button" style={{ width: '100%', backgroundColor: 'var(--zf-accent)', color: 'var(--zf-accent-text)', borderColor: 'var(--zf-accent)' }} onClick={() => handleAprovar(user.usuarioId)}>
                                    Aprovar Acesso
                                </button>
                            </div>
                        </div>
                    ))}
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