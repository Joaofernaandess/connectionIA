import { formatQuantityMasked } from '../../utils/quantity';
import LoadingWaves from '../LoadingWaves';
import ZeniteIcon from '../ZeniteIcon';

const getHistoricoVisual = (tipo) => {
    if (tipo === 1) {
        return {
            titulo: 'Entrada',
            icon: 'plus',
            cardClass: 'history-entry',
            amountClass: 'history-amount-entry',
            valor: ''
        };
    }

    if (tipo === 2) {
        return {
            titulo: 'Saída',
            icon: 'minus',
            cardClass: 'history-exit',
            amountClass: 'history-amount-exit',
            valor: '-'
        };
    }

    return {
        titulo: 'Transferência',
        icon: null,
        cardClass: 'history-transfer',
        amountClass: 'history-amount-transfer',
        valor: '↔'
    };
};

export default function HistoricoMovimentacoes({ historico, loading }) {
    if (loading) {
        return (
            <div className="detail-history-scroll">
                <LoadingWaves variant="cards" rows={4} label="Carregando histórico" className="history-grid" />
            </div>
        );
    }

    if (historico.length === 0) {
        return (
            <div className="detail-history-scroll">
                <div className="card history-empty-card">
                    <div className="empty-state-body-compact">
                        <p className="empty-state-text">Nenhuma movimentação registrada.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-history-scroll">
            <div className="history-grid mb-2">
                {historico.map((hist, index) => {
                    const qtd = Math.abs(hist.quantidadeResultante - hist.quantidadeAnterior);
                    const tipo = hist.tipoMovimentacao;
                    const data = hist.dataHora;
                    const nome = hist.nome || 'Sistema (Sem usuário)';
                    const visual = getHistoricoVisual(tipo);

                    return (
                        <div key={hist.historicoId || index} className="history-grid-item">
                            <div className={`card history-card ${visual.cardClass}`}>
                                <div className="history-card-content">
                                    <div className="history-card-info">
                                        <h4 className="history-card-title">
                                            {visual.icon && <ZeniteIcon name={visual.icon} size={16} />}
                                            {visual.titulo}
                                        </h4>
                                        <small className="history-card-meta">
                                            Data: {new Date(data).toLocaleString()}
                                        </small>
                                        <small className="history-card-meta">
                                            Responsável: <span className="text-accent">{nome}</span>
                                        </small>
                                        {tipo === 3 && (
                                            <small className="history-card-meta">
                                                De: <span className="text-accent">{hist.espacoOrigemNome || 'Espaço anterior'}</span>
                                                {' '}Para: <span className="text-accent">{hist.espacoDestinoNome || 'Novo espaço'}</span>
                                            </small>
                                        )}
                                    </div>
                                    <div className={`history-card-amount ${visual.amountClass}`}>
                                        {tipo === 3 ? (
                                            visual.valor
                                        ) : (
                                            <>
                                                {visual.icon && <ZeniteIcon name={visual.icon} size={14} />}
                                                <span>{formatQuantityMasked(qtd)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
