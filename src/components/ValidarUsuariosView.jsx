import { useCallback, useEffect, useState } from 'react';
import { getBaseUrl } from '../utils/apiConfig';
import { extrairErro, extrairMensagem } from '../utils/apiUtils';
import { formatPhone } from '../utils/phone';
import LoadingWaves from './LoadingWaves';
import MessageModal from './MessageModal';

export default function ValidarUsuariosView({ token }) {
    const [usuarios, setUsuarios] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

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

    const handleAprovar = async (usuarioId) => {
        setErro(''); setSucesso('');
        try {
            const response = await fetch(`${getBaseUrl()}/v1/usuarios/${usuarioId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setUsuarios(prev => prev.filter(u => u.usuarioId !== usuarioId));
            } else {
                setErro(await extrairErro(response));
            }
        } catch (error) {
            console.error(error);
        }
    };

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
        <div className="w-full inventory-list-fixed">
            <div className="inventory-list-fixed-header">
                <div className="inventory-list-header">
                    <h2 className="page-title no-margin">Usuários Pendentes</h2>
                </div>

                <div className="mb-2">
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, telefone ou unidade..."
                        value={pesquisa}
                        onChange={(e) => setPesquisa(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="inventory-list-scroll">
                {loading ? (
                    <LoadingWaves variant="cards" rows={3} label="Carregando usuários pendentes" />
                ) : usuariosFiltrados.length === 0 ? (
                    <div className="validation-empty-card">
                        <p className="empty-state-text">
                            {usuarios.length === 0 ? 'Nenhum usuário pendente de validação.' : 'Nenhum resultado encontrado para a pesquisa.'}
                        </p>
                    </div>
                ) : (
                    <div className="row">
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

                                    <button className="button button-full" onClick={() => handleAprovar(user.usuarioId)}>
                                        Aprovar Acesso
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
