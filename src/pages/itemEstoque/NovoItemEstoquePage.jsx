import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingWaves from '../../components/LoadingWaves';
import MessageModal from '../../components/MessageModal';
import { TIPO_UNIDADE } from '../../constants/tipoUnidade';
import { listarEspacos } from '../../services/espacoService';
import { criarItemEstoque } from '../../services/itemEstoqueService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../../utils/apiUtils';
import { criarPayloadItemEstoque } from '../../utils/itemEstoqueViewModel';
import { maskQuantityInput } from '../../utils/quantity';

const getInputClassName = (isError) => `w-full no-field-margin ${isError ? 'is-invalid' : ''}`;

export default function NovoItemEstoquePage({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ espacoId: '', descricao: '', tipoUnidadeMedida: 1, quantidade: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [erro, setErro] = useState('');

    const carregarEspacos = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;

        setLoading(true);
        setErro('');

        try {
            const response = await listarEspacos({ token, unidadeOrganizacionalId });

            if (response.ok) {
                const data = await response.json();
                setEspacos(data);
                setFormData(prev => ({
                    ...prev,
                    espacoId: prev.espacoId || data[0]?.espacoId || ''
                }));
            } else {
                const mensagem = await extrairErro(response);
                if (mensagem) setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [token, unidadeOrganizacionalId]);

    useEffect(() => {
        carregarEspacos();
    }, [carregarEspacos]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErro('');
        setFieldErrors({});

        const payload = criarPayloadItemEstoque({
            unidadeOrganizacionalId,
            formData,
            quantidadePadraoZero: true
        });

        try {
            const response = await criarItemEstoque({ token, payload });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                navigate('/itens-estoque', { replace: true, state: { sucesso: mensagem } });
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

    return (
        <div className="detail-view w-full">
            <div className="detail-heading">
                <h2 className="no-margin">Novo Item</h2>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="card detail-card">
                    <div className="detail-card-body">
                        {loading ? (
                            <LoadingWaves variant="list" rows={1} label="Carregando espaços" />
                        ) : (
                            <div className="row">
                                <div className="column-4 mb-1">
                                    <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição do Produto</label>
                                    <input
                                        type="text"
                                        value={formData.descricao}
                                        onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                        className={getInputClassName(fieldErrors.Descricao)}
                                    />
                                    {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                                </div>

                                <div className="column-3 mb-1">
                                    <label className={`label-sm ${fieldErrors.EspacoId ? 'error' : ''}`}>Local (Espaço)</label>
                                    <select
                                        value={formData.espacoId}
                                        onChange={e => setFormData({ ...formData, espacoId: e.target.value })}
                                        className={getInputClassName(fieldErrors.EspacoId)}
                                    >
                                        <option value="" disabled>Selecione...</option>
                                        {espacos.map(espaco => <option key={espaco.espacoId} value={espaco.espacoId}>{espaco.nome}</option>)}
                                    </select>
                                    {fieldErrors.EspacoId && <small className="invalid-feedback d-block">{fieldErrors.EspacoId}</small>}
                                </div>

                                <div className="column-3 mb-1">
                                    <label className={`label-sm ${fieldErrors.TipoUnidadeMedida ? 'error' : ''}`}>Unidade</label>
                                    <select
                                        value={formData.tipoUnidadeMedida}
                                        onChange={e => setFormData({ ...formData, tipoUnidadeMedida: e.target.value })}
                                        className={getInputClassName(fieldErrors.TipoUnidadeMedida)}
                                    >
                                        {Object.entries(TIPO_UNIDADE).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                                    </select>
                                    {fieldErrors.TipoUnidadeMedida && <small className="invalid-feedback d-block">{fieldErrors.TipoUnidadeMedida}</small>}
                                </div>

                                <div className="column-2 mb-1">
                                    <label className={`label-sm ${fieldErrors.Quantidade ? 'error' : 'text-muted'}`}>Saldo Inicial</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.quantidade}
                                        onChange={e => setFormData({ ...formData, quantidade: maskQuantityInput(e.target.value) })}
                                        className={getInputClassName(fieldErrors.Quantidade)}
                                    />
                                    {fieldErrors.Quantidade && <small className="invalid-feedback d-block">{fieldErrors.Quantidade}</small>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="detail-action-bar detail-action-bar-two">
                    <button type="button" className="button button-outline" onClick={() => navigate('/itens-estoque')}>
                        Voltar
                    </button>
                    <button type="submit" className="button" disabled={loading}>
                        Salvar
                    </button>
                </div>
            </form>

            {erro && (
                <MessageModal
                    type="error"
                    message={erro}
                    onClose={() => setErro('')}
                    autoClose={8000}
                />
            )}
        </div>
    );
}