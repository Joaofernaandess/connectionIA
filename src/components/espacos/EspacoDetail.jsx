import ExcluirEspacoModal from './ExcluirEspacoModal';
import ItensDoEspacoGrid from './ItensDoEspacoGrid';

export default function EspacoDetail({
    fieldErrors,
    formEdicao,
    houveMudanca,
    itensDoEspaco,
    loadingItens,
    messageModal,
    onChangeFormEdicao,
    onCloseDelete,
    onConfirmarEdicao,
    onExcluir,
    onOpenDelete,
    onQuantidadeItemChange,
    onSalvarQuantidadeItem,
    onVoltar,
    quantidadesEditadas,
    salvandoItemId,
    showDeleteModal
}) {
    return (
        <div className="detail-view w-full">
            <div className="detail-heading">
                <h2 className="no-margin">Detalhes do Espaço</h2>
            </div>

            <div className="card detail-card">
                <div className="detail-card-body">
                    <div className="row">
                        <div className="column-6 mb-1">
                            <label className={`label-sm ${fieldErrors.Nome ? 'error' : ''}`}>Nome do Espaço</label>
                            <input
                                type="text"
                                value={formEdicao.nome}
                                onChange={e => onChangeFormEdicao({ ...formEdicao, nome: e.target.value })}
                                className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                            />
                            {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                        </div>
                        <div className="column-6 mb-1">
                            <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição</label>
                            <input
                                type="text"
                                value={formEdicao.descricao}
                                onChange={e => onChangeFormEdicao({ ...formEdicao, descricao: e.target.value })}
                                className={`w-full no-field-margin ${fieldErrors.Descricao ? 'is-invalid' : ''}`}
                            />
                            {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="section-title">Itens neste espaço</h3>
            <ItensDoEspacoGrid
                itens={itensDoEspaco}
                loading={loadingItens}
                onQuantidadeChange={onQuantidadeItemChange}
                onSalvarQuantidade={onSalvarQuantidadeItem}
                quantidadesEditadas={quantidadesEditadas}
                salvandoItemId={salvandoItemId}
            />

            <div className="detail-action-bar">
                <button className="button button-outline" onClick={onVoltar}>
                    Voltar
                </button>
                <button className="button" onClick={onConfirmarEdicao} disabled={!houveMudanca}>
                    Salvar
                </button>
                <button className="button button-danger" onClick={onOpenDelete}>
                    Excluir
                </button>
            </div>

            {showDeleteModal && (
                <ExcluirEspacoModal onClose={onCloseDelete} onConfirm={onExcluir} />
            )}

            {messageModal}
        </div>
    );
}