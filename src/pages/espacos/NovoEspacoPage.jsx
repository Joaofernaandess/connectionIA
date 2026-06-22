import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageModal from '../../components/MessageModal';
import { criarEspaco } from '../../services/espacoService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../../utils/apiUtils';
import { criarPayloadEspaco } from '../../utils/espacoViewModel';

export default function NovoEspacoPage({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nome: '', descricao: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [erro, setErro] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErro('');
        setFieldErrors({});

        const payload = criarPayloadEspaco({ unidadeOrganizacionalId, formData });

        try {
            const response = await criarEspaco({ token, payload });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                navigate('/espacos', { replace: true, state: { sucesso: mensagem } });
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
        <div className="detail-view detail-form-view space-detail-form-view w-full">
            <div className="detail-heading">
                <h2 className="page-title no-margin">Novo Espaço</h2>
            </div>

            <form className="detail-form-layout" onSubmit={handleSubmit} noValidate>
                <div className="card detail-card detail-form-scroll-card">
                    <div className="detail-card-body">
                        <div className="row detail-form-fields">
                            <div className="column-12 mb-1">
                                <label className="label-sm">Nome</label>
                                <input
                                    type="text"
                                    placeholder="Digite o nome do espaço"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                                />
                                {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                            </div>
                            <div className="column-12 mb-1">
                                <label className="label-sm">Descrição</label>
                                <textarea
                                    rows={4}
                                    placeholder="Descreva o espaço"
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    className={`w-full no-field-margin ${fieldErrors.Descricao ? 'is-invalid' : ''}`}
                                ></textarea>
                                {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="detail-action-bar detail-action-bar-two">
                    <button type="button" className="button button-outline" onClick={() => navigate('/espacos')}>
                        <span className="button-icon-text">Voltar</span>
                    </button>
                    <button type="submit" className="button">
                        <span className="button-icon-text">Salvar</span>
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
