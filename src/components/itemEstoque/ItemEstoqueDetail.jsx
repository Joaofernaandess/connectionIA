import { TIPO_UNIDADE } from '../../constants/tipoUnidade';
import ZeniteIcon from '../ZeniteIcon';
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
    onSubmitMovimentar,
    onSubmitTransferir,
    onVoltar,
    showDeleteModal,
    showMovimentarModal,
    showTransferirModal,
    messageModal
}) {
    const isHistoricoMode = mode === 'historico';
    const viewClassName = `detail-view w-full ${isHistoricoMode ? 'detail-history-view' : 'detail-form-view space-detail-form-view space-create-form-view'}`;

    return (
        <div className={viewClassName}>
            <div className="detail-heading">
                <h2 className="no-margin">{isHistoricoMode ? 'Histórico do Item' : 'Detalhes do Item'}</h2>
            </div>

            {!isHistoricoMode && (
                <div className="detail-form-layout">
                    <div className="card detail-card detail-form-scroll-card">
                        <div className="detail-card-body">
                            <div className="row detail-form-fields">
                                <div className="column-12 mb-1">
                                    <label className="label-sm text-muted">Descrição</label>
                                    <input type="text" value={formEdicao.descricao} onChange={e => onChangeFormEdicao({ ...formEdicao, descricao: e.target.value })} className={getInputClassName(fieldErrors.Descricao)} />
                                    {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                                </div>
                                <div className="column-12 mb-1">
                                    <span className="label-sm text-muted">Unidade</span>
                                    <div className="space-items-unit-filter item-form-unit-filter" role="radiogroup" aria-label="Unidade de medida">
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
                                <div className="column-12 mb-1">
                                    <label className="label-sm text-muted">Saldo Atual</label>
                                    <input type="text" value={formEdicao.quantidade} className="w-full no-field-margin input-readonly" readOnly />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
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
                        <ZeniteIcon name="save" size={18}/>
                       <span className="button-icon-text"> Salvar</span>
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
                    fieldErrors={fieldErrors}
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
