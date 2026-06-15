import { TIPO_UNIDADE } from '../../constants/tipoUnidade';
import ExcluirItemModal from './ExcluirItemModal';
import HistoricoMovimentacoes from './HistoricoMovimentacoes';
import MovimentarEstoqueModal from './MovimentarEstoqueModal';
import TransferirItemModal from './TransferirItemModal';

const getInputClassName = (isError) => `w-full no-field-margin ${isError ? 'is-invalid' : ''}`;

export default function ItemEstoqueDetail({
    espacos,
    fieldErrors,
    formEdicao,
    historico,
    houveMudanca,
    itemAtivo,
    loadingHistorico,
    mode = 'editar',
    movimentacaoData,
    novoEspacoId,
    onAbrirMovimentacao,
    onChangeFormEdicao,
    onChangeMovimentacao,
    onChangeNovoEspaco,
    onCloseDelete,
    onCloseMovimentar,
    onCloseTransferir,
    onConfirmarEdicao,
    onExcluir,
    onOpenDelete,
    onOpenTransferir,
    onSubmitMovimentar,
    onSubmitTransferir,
    onVoltar,
    showDeleteModal,
    showMovimentarModal,
    showTransferirModal,
    messageModal
}) {
    const isHistoricoMode = mode === 'historico';

    return (
        <div className="detail-view w-full">
            <div className="detail-heading">
                <h2 className="no-margin">{isHistoricoMode ? 'Histórico do Item' : 'Detalhes do Item'}</h2>
            </div>

            {!isHistoricoMode && (
                <>
                    <div className="card detail-card">
                        <div className="detail-card-body">
                            <div className="row">
                                <div className="column-4 mb-1">
                                    <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição do Produto</label>
                                    <input type="text" value={formEdicao.descricao} onChange={e => onChangeFormEdicao({ ...formEdicao, descricao: e.target.value })} className={getInputClassName(fieldErrors.Descricao)} />
                                    {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                                </div>
                                <div className="column-4 mb-1">
                                    <span className={`label-sm ${fieldErrors.TipoUnidadeMedida ? 'error' : 'text-muted'}`}>Unidade</span>
                                    <div className="space-items-unit-filter" role="radiogroup" aria-label="Unidade de medida">
                                        {Object.entries(TIPO_UNIDADE).map(([key, val]) => (
                                            <label key={key} className="space-items-unit-option">
                                                <input
                                                    type="radio"
                                                    name="tipoUnidadeMedidaEditarItem"
                                                    value={key}
                                                    checked={Number(formEdicao.tipoUnidadeMedida) === Number(key)}
                                                    onChange={e => onChangeFormEdicao({ ...formEdicao, tipoUnidadeMedida: e.target.value })}
                                                />
                                                <span>{val}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {fieldErrors.TipoUnidadeMedida && <small className="invalid-feedback d-block">{fieldErrors.TipoUnidadeMedida}</small>}
                                </div>
                                <div className="column-4 mb-1">
                                    <label className="label-sm text-muted">Saldo Atual</label>
                                    <input type="text" value={formEdicao.quantidade} className="w-full no-field-margin" readOnly />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="button button-outline button-full mb-2" onClick={onOpenTransferir}>
                        Transferir item para outro espaço
                    </button>
                </>
            )}

            {isHistoricoMode && (
                <HistoricoMovimentacoes historico={historico} loading={loadingHistorico} />
            )}

            <div className={`detail-action-bar ${isHistoricoMode ? 'detail-action-bar-one' : 'detail-action-bar-two'}`}>
                <button className="button button-outline" onClick={onVoltar}>
                    Voltar
                </button>
                {!isHistoricoMode && (
                    <button className="button" onClick={onConfirmarEdicao} disabled={!houveMudanca}>
                        Salvar
                    </button>
                )}
            </div>

            {showMovimentarModal && (
                <MovimentarEstoqueModal
                    fieldErrors={fieldErrors}
                    item={itemAtivo}
                    movimentacaoData={movimentacaoData}
                    onChange={onChangeMovimentacao}
                    onClose={onCloseMovimentar}
                    onSubmit={onSubmitMovimentar}
                />
            )}

            {showDeleteModal && (
                <ExcluirItemModal onClose={onCloseDelete} onConfirm={onExcluir} />
            )}

            {showTransferirModal && (
                <TransferirItemModal
                    espacos={espacos}
                    item={itemAtivo}
                    novoEspacoId={novoEspacoId}
                    onChange={onChangeNovoEspaco}
                    onClose={onCloseTransferir}
                    onSubmit={onSubmitTransferir}
                />
            )}

            {messageModal}
        </div>
    );
}
