export default function ExcluirEspacoModal({ onClose, onConfirm }) {
    return (
        <div className="modal-overlay">
            <div className="card modal-card">
                <div className="modal-card-body">
                    <h2 className="modal-title">Excluir Espaço</h2>
                    <p className="modal-description">
                        Tem certeza que deseja excluir este espaço?
                    </p>
                    <div className="modal-actions">
                        <button type="button" className="button button-outline button-flex" onClick={onClose}>Cancelar</button>
                        <button type="button" className="button button-danger button-flex" onClick={onConfirm}>Excluir Definitivo</button>
                    </div>
                </div>
            </div>
        </div>
    );
}