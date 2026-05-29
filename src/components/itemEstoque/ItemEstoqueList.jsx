import { getTipoUnidadeSigla } from '../../constants/tipoUnidade';
import { formatQuantity } from '../../utils/quantity';
import LoadingWaves from '../LoadingWaves';

export default function ItemEstoqueList({
    getNomeEspaco,
    itens,
    loading,
    onAbrirDetalhes,
    onAbrirNovo,
    onChangePesquisa,
    pesquisa,
    messageModal
}) {
    return (
        <div className="w-full">
            <div className="inventory-list-header">
                <h2 className="no-margin">Itens de Estoque</h2>
                <button className="button inventory-list-header-action no-margin" onClick={onAbrirNovo}>+ Novo Item</button>
            </div>

            <div className="mb-2">
                <input
                    type="text"
                    placeholder="Pesquisar itens por descrição..."
                    value={pesquisa}
                    onChange={(e) => onChangePesquisa(e.target.value)}
                    className="w-full no-field-margin"
                />
            </div>

            {loading ? (
                <LoadingWaves variant="cards" rows={4} label="Carregando itens" className="inventory-grid-compact" />
            ) : itens.length === 0 ? (
                <div className="card empty-state-card">
                    <div className="empty-state-body">
                        <p className="empty-state-text">Nenhum item de estoque cadastrado.</p>
                    </div>
                </div>
            ) : (
                <div className="inventory-grid inventory-grid-compact">
                    {itens.map(item => (
                        <div key={item.itemEstoqueId} className="inventory-grid-item">
                            <div className="card inventory-card inventory-list-card inventory-item-list-card inventory-card-surface">
                                <div className="inventory-card-header">
                                    <div className="inventory-card-title-row">
                                        <h3 className="inventory-card-title">{item.descricao}</h3>
                                        <span className="inventory-card-badge">
                                            {formatQuantity(item.quantidade)} {getTipoUnidadeSigla(item.tipoUnidadeMedida)}
                                        </span>
                                    </div>
                                    <p className="inventory-card-description">
                                        Local: {getNomeEspaco(item.espacoId)}
                                    </p>
                                </div>
                                <div className="inventory-card-footer">
                                    <button className="button button-outline inventory-card-action" onClick={() => onAbrirDetalhes(item)}>
                                        Visualizar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {messageModal}
        </div>
    );
}