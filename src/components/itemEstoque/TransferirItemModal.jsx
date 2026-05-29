export default function TransferirItemModal({
    espacos,
    item,
    novoEspacoId,
    onChange,
    onClose,
    onSubmit
}) {
    return (
        <div className="modal-overlay">
            <div className="card transfer-modal-card">
                <h2 className="modal-title">Transferir de Espaço</h2>
                <p className="transfer-description">
                    Selecione o novo local para o item <strong>{item?.descricao}</strong>:
                </p>

                <form onSubmit={onSubmit} noValidate>
                    <div className="mb-2">
                        <label className="label-sm">Espaço de Destino</label>
                        <select
                            value={novoEspacoId}
                            onChange={e => onChange(e.target.value)}
                            className="transfer-select"
                        >
                            <option value="">Selecione um espaço...</option>
                            {espacos
                                .filter(e => e.espacoId !== item?.espacoId)
                                .map(e => (
                                    <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="button button-outline button-flex" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="button button-flex">
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}