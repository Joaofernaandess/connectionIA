export default function ProfilePage({
    fieldErrors,
    formData,
    onCancel,
    onChange,
    onSubmit
}) {
    return (
        <div className="detail-view detail-form-view w-full">
            <div className="detail-heading">
                <h2 className="page-title no-margin">Alterar Meus Dados</h2>
            </div>

            <form className="detail-form-layout" onSubmit={onSubmit} noValidate>
                <div className="card detail-card detail-form-scroll-card">
                    <div className="detail-card-body">
                        <div className="row">
                            <div className="column-12 mb-1">
                                <label className="label-sm">Nome</label>
                                <input
                                    type="text"
                                    placeholder="Digite seu nome"
                                    value={formData.nome}
                                    onChange={e => onChange({ ...formData, nome: e.target.value })}
                                    className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                                />
                                {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="detail-action-bar detail-action-bar-two">
                    <button type="button" className="button button-outline" onClick={onCancel}>Cancelar</button>
                    <button type="submit" className="button">Salvar</button>
                </div>
            </form>
        </div>
    );
}