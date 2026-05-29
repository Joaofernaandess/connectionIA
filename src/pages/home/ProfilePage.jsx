import PasswordInput from '../../components/PasswordInput';

export default function ProfilePage({
    fieldErrors,
    formData,
    onCancel,
    onChange,
    onSubmit
}) {
    return (
        <div className="row profile-row">
            <div className="column-6">
                <div className="card profile-card">
                    <div className="modal-card-body">
                        <h2 className="auth-title">Alterar Meus Dados</h2>

                        <form onSubmit={onSubmit} noValidate>
                            <div className="mb-1">
                                <label className="label-sm">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={e => onChange({ ...formData, nome: e.target.value })}
                                    className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                                />
                                {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                            </div>

                            <PasswordInput
                                label="Nova Senha"
                                placeholder="Senha"
                                value={formData.senha}
                                onChange={e => onChange({ ...formData, senha: e.target.value })}
                                error={!!fieldErrors.Senha}
                                errorMessage={fieldErrors.Senha}
                            />

                            <PasswordInput
                                label="Confirmar Senha"
                                placeholder="Confirme a senha"
                                value={formData.confirmaSenha}
                                onChange={e => onChange({ ...formData, confirmaSenha: e.target.value })}
                                error={!!fieldErrors.ConfirmaSenha}
                                errorMessage={fieldErrors.ConfirmaSenha}
                            />

                            <div className="modal-actions profile-actions">
                                <button type="button" className="button button-outline" onClick={onCancel}>Cancelar</button>
                                <button type="submit" className="button">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}