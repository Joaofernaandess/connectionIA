import { useMemo, useState } from 'react';
import { TIPO_UNIDADE, getTipoUnidadeSigla } from '../../constants/tipoUnidade';
import { formatQuantity } from '../../utils/quantity';
import LoadingWaves from '../LoadingWaves';
import ZeniteIcon from '../ZeniteIcon';

const TIPOS_UNIDADE_FILTRO = Object.entries(TIPO_UNIDADE).map(([value, label]) => ({
    value: Number(value),
    label
}));

const getItemDate = (item) => item.dataCadastro || item.dataCriacao || item.criadoEm || item.createdAt || item.dataHoraCadastro;

const formatItemDate = (item) => {
    const rawDate = getItemDate(item);
    if (!rawDate) return '';

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

export default function ItemEstoqueList({
    getNomeEspaco,
    itens,
    loading,
    onAbrirMovimentacao,
    onAbrirNovo,
    onChangePesquisa,
    onEditarItem,
    onExcluirItem,
    onHistoricoItem,
    pesquisa,
    excluindoItemId,
    messageModal
}) {
    const [tipoUnidadeSelecionada, setTipoUnidadeSelecionada] = useState('');
    const [menuAbertoId, setMenuAbertoId] = useState(null);

    const itensFiltrados = useMemo(() => {
        if (!tipoUnidadeSelecionada) return itens;

        return itens.filter(item => Number(item.tipoUnidadeMedida) === Number(tipoUnidadeSelecionada));
    }, [itens, tipoUnidadeSelecionada]);

    const totalFiltrado = useMemo(() => {
        if (!tipoUnidadeSelecionada) return itensFiltrados.length;

        return itensFiltrados.reduce((total, item) => total + Number(item.quantidade || 0), 0);
    }, [itensFiltrados, tipoUnidadeSelecionada]);

    const unidadeSelecionadaLabel = tipoUnidadeSelecionada ? getTipoUnidadeSigla(tipoUnidadeSelecionada) : 'itens';

    return (
        <div className="detail-view w-full">
            <div className={`space-items-manager ${menuAbertoId ? 'space-items-manager-open' : ''}`}>
                <div className="space-items-heading">
                    <h2 className="space-items-title">Itens de Estoque</h2>
                    <div className="space-items-total">
                        <span className="space-items-total-icon">
                            <ZeniteIcon name="check" size={16} />
                        </span>
                        <strong>Total:</strong>
                        <span>{formatQuantity(totalFiltrado)} {unidadeSelecionadaLabel}</span>
                    </div>
                </div>

                <label className="space-items-search">
                    <ZeniteIcon name="search" size={24} />
                    <input
                        type="text"
                        value={pesquisa}
                        onChange={event => onChangePesquisa(event.target.value)}
                        placeholder="Pesquisar ..."
                        className="space-items-search-input"
                    />
                </label>

                <div className="space-items-unit-filter" role="radiogroup" aria-label="Filtrar por unidade de medida">
                    <label className="space-items-unit-option">
                        <input
                            type="radio"
                            name="tipoUnidadeMedidaItensEstoque"
                            value=""
                            checked={tipoUnidadeSelecionada === ''}
                            onChange={() => setTipoUnidadeSelecionada('')}
                        />
                        <span>Todos os itens</span>
                    </label>
                    {TIPOS_UNIDADE_FILTRO.map(unidade => (
                        <label key={unidade.value} className="space-items-unit-option">
                            <input
                                type="radio"
                                name="tipoUnidadeMedidaItensEstoque"
                                value={unidade.value}
                                checked={Number(tipoUnidadeSelecionada) === unidade.value}
                                onChange={() => setTipoUnidadeSelecionada(unidade.value)}
                            />
                            <span>{unidade.label}</span>
                        </label>
                    ))}
                </div>

                {loading ? (
                    <LoadingWaves variant="cards" rows={4} label="Carregando itens" />
                ) : itens.length === 0 ? (
                    <div className="card detail-card">
                        <div className="empty-state-body-compact">
                            <p className="empty-state-text">Nenhum item de estoque cadastrado.</p>
                        </div>
                    </div>
                ) : itensFiltrados.length === 0 ? (
                    <div className="card detail-card">
                        <div className="empty-state-body-compact">
                            <p className="empty-state-text">Nenhum item encontrado para os filtros.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-items-list">
                        {itensFiltrados.map(item => (
                            <article
                                key={item.itemEstoqueId}
                                className={`card space-item-management-card ${menuAbertoId === item.itemEstoqueId ? 'space-item-management-card-open' : ''}`}
                            >
                                <div className="space-item-management-info">
                                    <h3 className="space-item-management-title">{item.descricao}</h3>
                                    <p className="space-item-management-location">
                                        Local: {getNomeEspaco(item.espacoId)}
                                    </p>
                                    <p className="space-item-management-quantity">
                                        {formatQuantity(item.quantidade)} {getTipoUnidadeSigla(item.tipoUnidadeMedida)}
                                    </p>
                                    {formatItemDate(item) && (
                                        <time className="space-item-management-date">{formatItemDate(item)}</time>
                                    )}
                                </div>

                                <div className="space-item-management-menu">
                                    <button
                                        type="button"
                                        className="space-item-menu-trigger"
                                        onClick={() => setMenuAbertoId(menuAbertoId === item.itemEstoqueId ? null : item.itemEstoqueId)}
                                        aria-label={`Abrir ações de ${item.descricao}`}
                                        aria-expanded={menuAbertoId === item.itemEstoqueId}
                                    >
                                        <ZeniteIcon name="ellipsis" size={28} />
                                    </button>

                                    {menuAbertoId === item.itemEstoqueId && (
                                        <div className="space-item-actions-menu">
                                            <button type="button" className="space-item-menu-action space-item-menu-entry" onClick={() => { setMenuAbertoId(null); onAbrirMovimentacao(item, 1); }}>
                                                <ZeniteIcon name="plus" size={22} />
                                                <span>Entrada</span>
                                            </button>
                                            <button type="button" className="space-item-menu-action space-item-menu-exit" onClick={() => { setMenuAbertoId(null); onAbrirMovimentacao(item, 2); }}>
                                                <ZeniteIcon name="minus" size={22} />
                                                <span>Saída</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="space-item-menu-action space-item-menu-delete"
                                                onClick={() => { setMenuAbertoId(null); onExcluirItem(item); }}
                                                disabled={excluindoItemId === item.itemEstoqueId}
                                            >
                                                <ZeniteIcon name="trash" size={22} />
                                                <span>Excluir</span>
                                            </button>
                                            <button type="button" className="space-item-menu-action space-item-menu-edit" onClick={() => { setMenuAbertoId(null); onEditarItem(item); }}>
                                                <ZeniteIcon name="pencil" size={22} />
                                                <span>Editar</span>
                                            </button>
                                            <button type="button" className="space-item-menu-action space-item-menu-history" onClick={() => { setMenuAbertoId(null); onHistoricoItem(item); }}>
                                                <ZeniteIcon name="clock" size={22} />
                                                <span>Histórico</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <div className="detail-action-bar detail-action-bar-one">
                <button className="button" onClick={onAbrirNovo}>
                    <ZeniteIcon name="plus" size={20} />
                    <span className="button-icon-text">Novo Item</span>
                </button>
            </div>

            {messageModal}
        </div>
    );
}