import { useEffect, useMemo, useRef, useState } from 'react';
import { TIPO_UNIDADE, getTipoUnidadeSigla } from '../../constants/tipoUnidade';
import { formatQuantityMasked } from '../../utils/quantity';
import LoadingWaves from '../LoadingWaves';
import ZeniteIcon from '../ZeniteIcon';

const TIPOS_UNIDADE_FILTRO = Object.entries(TIPO_UNIDADE).map(([value, label]) => ({
    value: Number(value),
    label
}));
const TIPO_UNIDADE_LITROS = 1;

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

export default function ItensDoEspacoGrid({
    espaco,
    itens,
    loading,
    onAbrirMovimentacao,
    onEditarItem,
    onExcluirItem,
    onHistoricoItem,
    onTransferirItem,
    excluindoItemId
}) {
    const [pesquisa, setPesquisa] = useState('');
    const [tipoUnidadeSelecionada, setTipoUnidadeSelecionada] = useState(TIPO_UNIDADE_LITROS);
    const [filtrosAbertos, setFiltrosAbertos] = useState(true);
    const [menuAbertoId, setMenuAbertoId] = useState(null);
    const [menuDirection, setMenuDirection] = useState('down');
    const [menuPos, setMenuPos] = useState({ top: 0, bottom: 'auto', left: 0, width: 220, triggerLeft: 0, triggerWidth: 0, triggerBottom: 0 });
    const menuTriggerRefs = useRef({});

    useEffect(() => {
        if (!menuAbertoId) return;

        const fecharMenuAoClicarFora = (event) => {
            if (
                !event.target.closest('.space-item-management-menu') &&
                !event.target.closest('.space-item-actions-menu')
            ) {
                setMenuAbertoId(null);
            }
        };

        const fecharMenuAoScroll = () => setMenuAbertoId(null);
        const scrollContainer = document.querySelector('.inventory-list-scroll');

        document.addEventListener('pointerdown', fecharMenuAoClicarFora);
        scrollContainer?.addEventListener('scroll', fecharMenuAoScroll, { passive: true });

        return () => {
            document.removeEventListener('pointerdown', fecharMenuAoClicarFora);
            scrollContainer?.removeEventListener('scroll', fecharMenuAoScroll);
        };
    }, [menuAbertoId]);

    const itensFiltrados = useMemo(() => {
        const termo = pesquisa.trim().toLowerCase();

        return itens.filter(item => {
            const correspondeUnidade = Number(item.tipoUnidadeMedida) === Number(tipoUnidadeSelecionada);
            const correspondePesquisa = !termo || item.descricao?.toLowerCase().includes(termo);
            return correspondeUnidade && correspondePesquisa;
        });
    }, [itens, pesquisa, tipoUnidadeSelecionada]);

    const totalFiltrado = useMemo(() => {
        return itensFiltrados.reduce((total, item) => total + Number(item.quantidade || 0), 0);
    }, [itensFiltrados]);

    const unidadeSelecionadaLabel = getTipoUnidadeSigla(tipoUnidadeSelecionada);
    const arrowOffsetLeft = menuPos.triggerLeft - menuPos.left + menuPos.triggerWidth / 2 - 8;

    const renderEmptyState = (message) => (
        <div className="empty-state-plain">
            <div className="empty-state-icon">
                <ZeniteIcon name="ban" size={92} strokeWidth={1.7} />
            </div>
            <p className="empty-state-text">{message}</p>
        </div>
    );

    return (
        <>
            <div className="inventory-list-fixed-header">
                <div className="space-items-heading">
                    <h2 className="page-title no-margin">{espaco?.nome}</h2>
                    <div className="space-items-total">
                        <span className="space-items-total-icon">
                            <ZeniteIcon name="check" size={16} />
                        </span>
                        <strong>Total:</strong>
                        <span>{formatQuantityMasked(totalFiltrado)} {unidadeSelecionadaLabel}</span>
                    </div>
                </div>

                <section className={`space-items-filter-accordion ${filtrosAbertos ? 'is-open' : ''}`}>
                    <button
                        type="button"
                        className="space-items-filter-summary"
                        aria-expanded={filtrosAbertos}
                        onClick={() => setFiltrosAbertos(prev => !prev)}
                    >
                        Filtros
                    </button>
                    <div className="space-items-filter-content">
                        <label className="space-items-search">
                            <ZeniteIcon name="search" size={22} />
                            <input
                                type="text"
                                value={pesquisa}
                                onChange={event => setPesquisa(event.target.value)}
                                placeholder="Pesquisar ..."
                                className="space-items-search-input"
                            />
                        </label>

                        <div className="space-items-unit-filter" role="radiogroup" aria-label="Filtrar por unidade de medida">
                            {TIPOS_UNIDADE_FILTRO.map(unidade => (
                                <label key={unidade.value} className="space-items-unit-option">
                                    <input
                                        type="radio"
                                        name="tipoUnidadeMedidaEspaco"
                                        value={unidade.value}
                                        checked={Number(tipoUnidadeSelecionada) === unidade.value}
                                        onChange={() => setTipoUnidadeSelecionada(unidade.value)}
                                    />
                                    <span>{unidade.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <div className={`inventory-list-scroll space-items-manager ${menuAbertoId ? 'space-items-manager-open' : ''}`}>
                {loading ? (
                    <LoadingWaves variant="cards" rows={3} label="Carregando inventário" className="space-items-list" />
                ) : itens.length === 0 ? (
                    renderEmptyState('Este espaço ainda não possui itens cadastrados.')
                ) : itensFiltrados.length === 0 ? (
                    renderEmptyState('Nenhum item encontrado para os filtros informados.')
                ) : (
                    <div className="space-items-list">
                        {itensFiltrados.map(item => (
                            <article
                                key={item.itemEstoqueId}
                                className={`card space-item-management-card ${menuAbertoId === item.itemEstoqueId ? 'space-item-management-card-open' : ''}`}
                            >
                                <div className="space-item-management-info">
                                    <h3 className="space-item-management-title">{item.descricao}</h3>
                                    <p className="space-item-management-quantity">
                                        {formatQuantityMasked(item.quantidade)} {getTipoUnidadeSigla(item.tipoUnidadeMedida)}
                                    </p>
                                    {formatItemDate(item) && (
                                        <time className="space-item-management-date">{formatItemDate(item)}</time>
                                    )}
                                </div>

                                <div className="space-item-management-menu">
                                    <button
                                        type="button"
                                        ref={(el) => { menuTriggerRefs.current[item.itemEstoqueId] = el; }}
                                        className="space-item-menu-trigger"
                                        onClick={() => {
                                            const novoId = menuAbertoId === item.itemEstoqueId ? null : item.itemEstoqueId;
                                            setMenuAbertoId(novoId);

                                            if (novoId) {
                                                const trigger = menuTriggerRefs.current[novoId];
                                                if (trigger) {
                                                    const rect = trigger.getBoundingClientRect();
                                                    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
                                                    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
                                                    const menuWidth = Math.min(200, viewportWidth - 16);
                                                    const menuHeight = 310;

                                                    const spaceBelow = viewportHeight - rect.bottom - 8;
                                                    const spaceAbove = rect.top - 8;
                                                    const leftPos = Math.max(8, Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 8));

                                                    let direction;
                                                    let topPos = undefined;
                                                    let bottomPos = undefined;

                                                    if (spaceBelow >= menuHeight) {
                                                        direction = 'down';
                                                        topPos = rect.bottom + 4;
                                                    } else if (spaceAbove >= menuHeight) {
                                                        direction = 'up';
                                                        bottomPos = viewportHeight - rect.top + 4;
                                                    } else {
                                                        direction = 'center';
                                                        topPos = Math.max(8, (viewportHeight - menuHeight) / 2);
                                                    }

                                                    setMenuDirection(direction);
                                                    setMenuPos({
                                                        top: topPos,
                                                        bottom: bottomPos,
                                                        left: leftPos,
                                                        width: menuWidth,
                                                        triggerLeft: rect.left,
                                                        triggerWidth: rect.width,
                                                        triggerBottom: rect.bottom,
                                                    });
                                                }
                                            }
                                        }}
                                        aria-label={`Abrir ações de ${item.descricao}`}
                                        aria-expanded={menuAbertoId === item.itemEstoqueId}
                                    >
                                        <ZeniteIcon name="ellipsis" size={28} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {menuAbertoId && (() => {
                const item = itensFiltrados.find(i => i.itemEstoqueId === menuAbertoId);
                if (!item) return null;

                return (
                    <div
                        className={`space-item-actions-menu space-item-actions-menu-${menuDirection}`}
                        style={{
                            position: 'fixed',
                            top: menuPos.top ?? 'auto',
                            bottom: menuPos.bottom ?? 'auto',
                            left: menuPos.left,
                            width: menuPos.width,
                            zIndex: 9999,
                            '--arrow-offset': `${arrowOffsetLeft}px`,
                            ...(menuDirection === 'down' && {
                                maxHeight: `calc(100dvh - ${menuPos.top ?? 0}px - 8px)`,
                                overflowY: 'auto',
                            }),
                        }}
                    >
                        <button type="button" className="button button-sm space-item-action space-item-menu-entry" onClick={() => { setMenuAbertoId(null); onAbrirMovimentacao(item, 1); }}>
                            <ZeniteIcon name="plus" size={22} />
                            <span>Entrada</span>
                        </button>
                        <button type="button" className="button button-sm space-item-action space-item-menu-exit" onClick={() => { setMenuAbertoId(null); onAbrirMovimentacao(item, 2); }}>
                            <ZeniteIcon name="minus" size={22} />
                            <span>Saída</span>
                        </button>
                        <button type="button" className="button button-sm space-item-action space-item-menu-transfer" onClick={() => { setMenuAbertoId(null); onTransferirItem(item); }}>
                            <ZeniteIcon name="transfer" size={22} />
                            <span>Transferir</span>
                        </button>
                        <button
                            type="button"
                            className="button button-sm space-item-action space-item-menu-delete"
                            onClick={() => { setMenuAbertoId(null); onExcluirItem(item); }}
                            disabled={excluindoItemId === item.itemEstoqueId}
                        >
                            <ZeniteIcon name="trash" size={22} />
                            <span>Excluir</span>
                        </button>
                        <button type="button" className="button button-sm space-item-action space-item-menu-edit" onClick={() => { setMenuAbertoId(null); onEditarItem(item); }}>
                            <ZeniteIcon name="pencil" size={22} />
                            <span>Editar</span>
                        </button>
                        <button type="button" className="button button-sm space-item-action space-item-menu-history" onClick={() => { setMenuAbertoId(null); onHistoricoItem(item); }}>
                            <ZeniteIcon name="clock" size={22} />
                            <span>Histórico</span>
                        </button>
                    </div>
                );
            })()}
        </>
    );
}