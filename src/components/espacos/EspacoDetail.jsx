import ExcluirItemModal from '../itemEstoque/ExcluirItemModal';
import ZeniteIcon from '../ZeniteIcon';
import ItensDoEspacoGrid from './ItensDoEspacoGrid';

export default function EspacoDetail({
    fieldErrors,
    formEdicao,
    houveMudanca,
    itensDoEspaco,
    loadingItens,
    messageModal,
    mode = 'editar',
    onChangeFormEdicao,
    onConfirmarEdicao,
    onEditarItem,
    onExcluirItem,
    onHistoricoItem,
    onNovoItem,
    onAbrirMovimentacaoItem,
    onTransferirItem,
    onCloseDeleteItem,
    onConfirmDeleteItem,
    onVoltar,
    excluindoItemId,
    showDeleteItemModal,
}) {
    const isItensMode = mode === 'itens';

    return (
        <div className={isItensMode ? 'w-full inventory-list-fixed' : 'detail-view w-full detail-form-view space-detail-form-view space-create-form-view'}>
            {!isItensMode && (
                <div className="detail-heading">
                    <h2 className="page-title no-margin">Detalhes do Espaço</h2>
                </div>
            )}

            {!isItensMode && (
                <div className="card detail-card detail-form-scroll-card">
                    <div className="detail-card-body">
                        <div className="row detail-form-fields">
                            <div className="column-12 mb-1">
                                <label className="label-sm">Nome</label>
                                <input
                                    type="text"
                                    placeholder="Digite o nome do espaço"
                                    value={formEdicao.nome}
                                    onChange={e => onChangeFormEdicao({ ...formEdicao, nome: e.target.value })}
                                    className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                                />
                                {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                            </div>
                            <div className="column-12 mb-1">
                                <label className="label-sm">Descrição</label>
                                <textarea
                                    rows={10}
                                    placeholder="Descreva o espaço"
                                    value={formEdicao.descricao}
                                    onChange={e => onChangeFormEdicao({ ...formEdicao, descricao: e.target.value })}
                                    className={`w-full no-field-margin ${fieldErrors.Descricao ? 'is-invalid' : ''}`}
                                ></textarea>
                                {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isItensMode && (
                <>
                    <ItensDoEspacoGrid
                        espaco={formEdicao}
                        itens={itensDoEspaco}
                        loading={loadingItens}
                        onAbrirMovimentacao={onAbrirMovimentacaoItem}
                        onEditarItem={onEditarItem}
                        onExcluirItem={onExcluirItem}
                        onHistoricoItem={onHistoricoItem}
                        onTransferirItem={onTransferirItem}
                        excluindoItemId={excluindoItemId}
                    />
                </>
            )}

            <div className="detail-action-bar detail-action-bar-two">
                <button className="button button-outline" onClick={onVoltar}>
                    Voltar
                </button>
                {!isItensMode && (
                    <>
                        <button className="button" onClick={onConfirmarEdicao} disabled={!houveMudanca}>
                            Salvar
                        </button>
                    </>
                )}
                {isItensMode && (
                    <button className="button" onClick={onNovoItem}>
                        <ZeniteIcon name="plus" size={20} />
                        <span className="button-icon-text">Novo</span>
                    </button>
                )}
            </div>

            {showDeleteItemModal && (
                <ExcluirItemModal onClose={onCloseDeleteItem} onConfirm={onConfirmDeleteItem} />
            )}

            {messageModal}
        </div>
    );
}
