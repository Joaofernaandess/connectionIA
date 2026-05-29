import { TIPO_UNIDADE } from '../../constants/tipoUnidade';
import { formatQuantity, parseQuantity } from '../../utils/quantity';
import LoadingWaves from '../LoadingWaves';

export default function ItensDoEspacoGrid({
    itens,
    loading,
    onQuantidadeChange,
    onSalvarQuantidade,
    quantidadesEditadas,
    salvandoItemId
}) {
    if (loading) {
        return <LoadingWaves variant="cards" rows={3} label="Carregando inventário" />;
    }

    if (itens.length === 0) {
        return (
            <div className="card detail-card">
                <div className="empty-state-body-compact">
                    <p className="empty-state-text">Este espaço está vazio.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="inventory-grid inventory-grid-compact mb-2">
            {itens.map(item => (
                <div key={item.itemEstoqueId} className="inventory-grid-item">
                    <div className="card inventory-card space-item-card">
                        <div className="space-item-card-body">
                            <div className="space-item-card-header">
                                <div>
                                    <h4 className="space-item-title">{item.descricao}</h4>
                                    <small className="space-item-unit">{TIPO_UNIDADE[item.tipoUnidadeMedida] || 'UN'}</small>
                                </div>
                                <div className="space-item-quantity-badge">
                                    {formatQuantity(item.quantidade)}
                                </div>
                            </div>
                            <div>
                                <label className="label-sm">Quantidade</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={quantidadesEditadas[item.itemEstoqueId] ?? ''}
                                    onChange={e => onQuantidadeChange(item.itemEstoqueId, e.target.value)}
                                    className="w-full no-field-margin"
                                />
                            </div>
                            <button
                                className="button button-outline button-full"
                                onClick={() => onSalvarQuantidade(item)}
                                disabled={salvandoItemId === item.itemEstoqueId || parseQuantity(quantidadesEditadas[item.itemEstoqueId]) === parseQuantity(item.quantidade)}
                            >
                                {salvandoItemId === item.itemEstoqueId ? 'Salvando...' : 'Atualizar quantidade'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}