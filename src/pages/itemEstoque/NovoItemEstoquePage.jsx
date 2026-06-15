import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MessageModal from '../../components/MessageModal';
import { TIPO_UNIDADE } from '../../constants/tipoUnidade';
import { criarItemEstoque } from '../../services/itemEstoqueService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../../utils/apiUtils';
import { criarPayloadItemEstoque } from '../../utils/itemEstoqueViewModel';
import { maskQuantityInputFixed3 } from '../../utils/quantity';

const getInputClassName = (isError) => `w-full no-field-margin ${isError ? 'is-invalid' : ''}`;

export default function NovoItemEstoquePage({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const espacoOrigemId = location.state?.espacoId || searchParams.get('espacoId') || '';
    const [formData, setFormData] = useState({ espacoId: espacoOrigemId, descricao: '', tipoUnidadeMedida: 1, quantidade: '0,000' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (espacoOrigemId) return;

        navigate('/espacos', { replace: true });
    }, [espacoOrigemId, navigate]);

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
                const rotaRetorno = espacoOrigemId ? `/espacos/${espacoOrigemId}/itens` : '/itens-estoque';
                navigate(rotaRetorno, { replace: true, state: { sucesso: mensagem } });
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
        <div className="detail-view detail-form-view w-full">
            <div className="detail-heading">
                <h2 className="no-margin">Novo Item</h2>
            </div>

            <form className="detail-form-layout" onSubmit={handleSubmit} noValidate>
                <div className="card detail-card detail-form-scroll-card">
                    <div className="detail-card-body">
                        <div className="row">
                            <div className="column-12 mb-1">
                                <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição do Produto</label>
                                <input
                                    type="text"
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    className={getInputClassName(fieldErrors.Descricao)}
                                />
                                {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                            </div>

                            <div className="column-12 mb-1">
                                <span className={`label-sm ${fieldErrors.TipoUnidadeMedida ? 'error' : 'text-muted'}`}>Unidade</span>
                                <div className="space-items-unit-filter" role="radiogroup" aria-label="Unidade de medida">
                                    {Object.entries(TIPO_UNIDADE).map(([key, val]) => (
                                        <label key={key} className="space-items-unit-option">
                                            <input
                                                type="radio"
                                                name="tipoUnidadeMedidaNovoItem"
                                                value={key}
                                                checked={Number(formData.tipoUnidadeMedida) === Number(key)}
                                                onChange={e => setFormData({ ...formData, tipoUnidadeMedida: e.target.value })}
                                            />
                                            <span>{val}</span>
                                        </label>
                                    ))}
                                </div>
                                {fieldErrors.TipoUnidadeMedida && <small className="invalid-feedback d-block">{fieldErrors.TipoUnidadeMedida}</small>}
                            </div>

                            <div className="column-12 mb-1">
                                <label className={`label-sm ${fieldErrors.Quantidade ? 'error' : 'text-muted'}`}>Saldo Inicial</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.quantidade}
                                    onChange={e => setFormData({ ...formData, quantidade: maskQuantityInputFixed3(e.target.value) })}
                                    className={getInputClassName(fieldErrors.Quantidade)}
                                />
                                {fieldErrors.Quantidade && <small className="invalid-feedback d-block">{fieldErrors.Quantidade}</small>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="detail-action-bar detail-action-bar-two">
                    <button type="button" className="button button-outline" onClick={() => navigate(espacoOrigemId ? `/espacos/${espacoOrigemId}/itens` : '/itens-estoque')}>
                        Voltar
                    </button>
                    <button type="submit" className="button">
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