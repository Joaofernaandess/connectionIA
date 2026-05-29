import { maskQuantityInput } from '../../utils/quantity';

const getInputClassName = (isError) => `w-full no-field-margin ${isError ? 'is-invalid' : ''}`;

export default function MovimentarEstoqueModal({
    fieldErrors,
    item,
    movimentacaoData,
    onChange,
    onClose,
    onSubmit
}) {
    return (
        <div className="modal-overlay">
            <div className="card movement-modal-card">
                <div className="modal-card-body">
                    <h2 className="movement-modal-title">Movimentar Estoque</h2>
                    <p className="movement-item-name">{item?.descricao}</p>

                    <form onSubmit={onSubmit} noValidate>
                        <div className="mb-2">
                            <span className="label-sm text-muted">Operação</span>
                            <div className={`movement-operation-summary ${movimentacaoData.tipoMovimentacao == 2 ? 'movement-operation-exit' : 'movement-operation-entry'}`}>
                                {movimentacaoData.tipoMovimentacao == 2 ? 'Saída (-)' : 'Entrada (+)'}
                            </div>
                            {fieldErrors.TipoMovimentacao && <small className="invalid-feedback d-block">{fieldErrors.TipoMovimentacao}</small>}
                        </div>

                        <div className="mb-2">
                            <label className="label-sm">Quantidade</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={movimentacaoData.quantidadeMovimento}
                                onChange={e => onChange({ ...movimentacaoData, quantidadeMovimento: maskQuantityInput(e.target.value) })}
                                className={getInputClassName(fieldErrors.QuantidadeMovimento)}
                            />
                            {fieldErrors.QuantidadeMovimento && <small className="invalid-feedback d-block">{fieldErrors.QuantidadeMovimento}</small>}
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="button button-outline" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="button button-accent-confirm">Confirmar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}