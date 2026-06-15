import LoadingWaves from '../LoadingWaves';
import ZeniteIcon from '../ZeniteIcon';

export default function EspacoList({
    espacos,
    espacosFiltrados,
    loading,
    messageModal,
    onEditarEspaco,
    onExcluirEspaco,
    onGerenciarItens,
    onAbrirNovo,
    onChangePesquisa,
    pesquisa
}) {
    return (
        <div className="w-full inventory-list-fixed">
            <div className="inventory-list-fixed-header">
                <div className="inventory-list-header">
                    <h2 className="page-title no-margin">Gestão de Espaços</h2>
                    <button className="button inventory-list-header-action no-margin" onClick={onAbrirNovo}>
                        <ZeniteIcon name="plus" />
                        <span className="button-icon-text">Novo espaço</span>
                    </button>
                </div>

                <div className="mb-2">
                    <input
                        type="text"
                        placeholder="Pesquisar espaços..."
                        value={pesquisa}
                        onChange={(e) => onChangePesquisa(e.target.value)}
                        className="w-full no-field-margin"
                    />
                </div>
            </div>

            <div className="inventory-list-scroll">
                {loading ? (
                    <LoadingWaves variant="cards" rows={4} label="Carregando espaços" />
                ) : espacosFiltrados.length === 0 ? (
                    espacos.length === 0 ? (
                        <div className="empty-state-plain">
                            <div className="empty-state-icon">
                                <ZeniteIcon name="ban" size={92} strokeWidth={1.7} />
                            </div>
                            <p className="empty-state-text">Nenhum espaço cadastrado nesta unidade.</p>
                        </div>
                    ) : (
                        <div className="empty-state-plain">
                            <div className="empty-state-icon">
                                <ZeniteIcon name="ban" size={92} strokeWidth={1.7} />
                            </div>
                            <p className="empty-state-text">Nenhum espaço encontrado para a pesquisa.</p>
                        </div>
                    )
                ) : (
                    <div className="inventory-grid">
                        {espacosFiltrados.map(espaco => (
                            <div key={espaco.espacoId} className="inventory-grid-item">
                                <div className="card inventory-card inventory-list-card space-list-card inventory-card-surface">
                                    <div className="space-list-card-main">
                                        <div className="inventory-card-header">
                                            <h3 className="inventory-card-title">{espaco.nome}</h3>
                                            <p className="inventory-card-description">
                                                {espaco.descricao || 'Sem descrição'}
                                            </p>
                                        </div>
                                        <div className="space-list-card-actions">
                                            <button
                                                type="button"
                                                className="button-icon-accent"
                                                onClick={() => onEditarEspaco(espaco)}
                                                aria-label={`Editar ${espaco.nome}`}
                                            >
                                                <ZeniteIcon name="pencil" size={22} />
                                            </button>
                                            <button
                                                type="button"
                                                className="button-icon-danger"
                                                onClick={() => onExcluirEspaco(espaco)}
                                                aria-label={`Excluir ${espaco.nome}`}
                                            >
                                                <ZeniteIcon name="trash" size={22} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="inventory-card-footer">
                                        <button className="button button-outline inventory-card-action" onClick={() => onGerenciarItens(espaco)}>
                                            Itens
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {messageModal}
        </div>
    );
}