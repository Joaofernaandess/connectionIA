import LoadingWaves from '../LoadingWaves';
import ZeniteIcon from '../ZeniteIcon';

export default function EspacoList({
    espacos,
    espacosFiltrados,
    loading,
    messageModal,
    onAbrirDetalhes,
    onAbrirNovo,
    onChangePesquisa,
    pesquisa
}) {
    return (
        <div className="w-full">
            <div className="inventory-list-header">
                <h2 className="no-margin">Gestão de Espaços</h2>
                <button className="button inventory-list-header-action no-margin" onClick={onAbrirNovo}>
                    <ZeniteIcon name="plus" />
                    <span className="button-icon-text">Novo espaço</span>
                </button>
            </div>

            <div className="mb-2">
                <input
                    type="text"
                    placeholder="Pesquisar espaços por nome ou descrição..."
                    value={pesquisa}
                    onChange={(e) => onChangePesquisa(e.target.value)}
                    className="w-full no-field-margin"
                />
            </div>

            {loading ? (
                <LoadingWaves variant="cards" rows={4} label="Carregando espaços" />
            ) : espacosFiltrados.length === 0 ? (
                <div className="card empty-state-card">
                    <div className="empty-state-body">
                        <p className="empty-state-text">
                            {espacos.length === 0 ? 'Nenhum espaço cadastrado nesta unidade.' : 'Nenhum espaço encontrado para a pesquisa.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="inventory-grid">
                    {espacosFiltrados.map(espaco => (
                        <div key={espaco.espacoId} className="inventory-grid-item">
                            <div className="card inventory-card inventory-list-card inventory-card-surface">
                                <div className="inventory-card-header">
                                    <h3 className="inventory-card-title">{espaco.nome}</h3>
                                    <p className="inventory-card-description">
                                        {espaco.descricao || 'Sem descrição'}
                                    </p>
                                </div>
                                <div className="inventory-card-footer">
                                    <button className="button button-outline inventory-card-action" onClick={() => onAbrirDetalhes(espaco)}>
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