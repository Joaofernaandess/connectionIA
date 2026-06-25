import { useCallback, useEffect, useState } from 'react';
import { getBaseUrl } from '../utils/apiConfig';
import { extrairErro, extrairMensagem } from '../utils/apiUtils';
import { formatPhone } from '../utils/phone';
import LoadingWaves from './LoadingWaves';
import MessageModal from './MessageModal';
import ZeniteIcon from './ZeniteIcon';

export default function ValidarUsuariosView({ token }) {
    const [usuarios, setUsuarios] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [usuarioParaAprovar, setUsuarioParaAprovar] = useState(null);

    const carregarUsuariosPendentes = useCallback(async () => {
        setErro('');
        setLoading(true);
        try {
            const response = await fetch(`${getBaseUrl()}/v1/usuarios?cadastroCompleto=false&top=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setUsuarios(await response.json());
            } else {
                const mensagem = await extrairErro(response);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        carregarUsuariosPendentes();
    }, [carregarUsuariosPendentes]);

    const handleAprovar = async () => {
        if (!usuarioParaAprovar) return;

        setErro(''); setSucesso('');
        try {
            const response = await fetch(`${getBaseUrl()}/v1/usuarios/${usuarioParaAprovar.usuarioId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setUsuarios(prev => prev.filter(u => u.usuarioId !== usuarioParaAprovar.usuarioId));
                setUsuarioParaAprovar(null);
            } else {
                setErro(await extrairErro(response));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderEmptyState = () => (
        <div className="empty-state-plain validation-empty-state">
            <div className="empty-state-icon">
                <ZeniteIcon name="ban" size={92} strokeWidth={1.7} />
            </div>
            <p className="empty-state-text">
                {usuarios.length === 0 ? 'Nenhum usuário pendente de aprovação.' : 'Nenhum resultado encontrado para a pesquisa.'}
            </p>
        </div>
    );

    const usuariosFiltrados = usuarios.filter(user => {
        const termo = pesquisa.toLowerCase();
        return (
            user.nome?.toLowerCase().includes(termo) ||
            user.username?.toLowerCase().includes(termo) ||
            formatPhone(user.username).toLowerCase().includes(termo) ||
            user.nomeUnidadeOrganizacional?.toLowerCase().includes(termo)
        );
    });

    return (
        <div className="w-full inventory-list-fixed validation-user-view">
            <div className="inventory-list-fixed-header">
                <div className="inventory-list-header">
                    <h2 className="page-title no-margin">Usuários Pendentes</h2>
                </div>

                <div className="mb-2">
                    <input
                        type="text"
                        placeholder="Pesquisar ..."
                        value={pesquisa}
                        onChange={(e) => setPesquisa(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="inventory-list-scroll validation-user-scroll">
                {loading ? (
                    <LoadingWaves variant="cards" rows={4} label="Carregando usuários pendentes" className="validation-loading-grid" />
                ) : usuariosFiltrados.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <div className="row validation-user-grid">
                        {usuariosFiltrados.map(user => (
                            <div key={user.usuarioId} className="column-4 mb-1">

                                <div className="card validation-user-card">
                                    <h3 className="validation-user-title">{user.nome}</h3>

                                    <p className="validation-user-meta">
                                        <strong>Username:</strong> {formatPhone(user.username)}
                                    </p>

                                    <p className="validation-user-description">
                                        <strong>Unidade:</strong> {user.nomeUnidadeOrganizacional || 'Sem Unidade'}
                                    </p>

                                    <button className="button button-full" onClick={() => setUsuarioParaAprovar(user)}>
                                        Aprovar Acesso
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {usuarioParaAprovar && (
                <div className="modal-overlay">
                    <div className="card modal-card">
                        <div className="modal-card-body">
                            <h2 className="modal-title">Validar Acesso</h2>
                            <p className="modal-description">
                                Deseja validar o acesso do usuário {usuarioParaAprovar.nome}?
                            </p>
                            <div className="modal-actions">
                                <button type="button" className="button button-outline button-flex" onClick={() => setUsuarioParaAprovar(null)}>
                                    Cancelar
                                </button>
                                <button type="button" className="button button-flex" onClick={handleAprovar}>
                                    Confirmar
                                </button>
                            </div>
                        </div>
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
