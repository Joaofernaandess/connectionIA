import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LoadingWaves from '../../components/LoadingWaves';
import PizzaDashboardChart from '../../components/charts/PizzaDashboardChart';
import { TIPO_UNIDADE, getTipoUnidadeSigla } from '../../constants/tipoUnidade';
import { listarEspacos } from '../../services/espacoService';
import { listarItensEstoque } from '../../services/itemEstoqueService';
import { obterPizzaDashboard } from '../../services/relatorioService';
import { formatQuantityMasked } from '../../utils/quantity';

const TIPOS_UNIDADE_FILTRO = Object.entries(TIPO_UNIDADE).map(([value, label]) => ({
  value: Number(value),
  label
}));
const TIPO_UNIDADE_LITROS = 1;

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export default function DashboardPage({ token, unidadeOrganizacionalId }) {
  const [espacos, setEspacos] = useState([]);
  const [espacoId, setEspacoId] = useState('');
  const [tipoUnidadeMedida, setTipoUnidadeMedida] = useState(TIPO_UNIDADE_LITROS);
  const [pizzaData, setPizzaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(getCurrentTheme());
  const [isOpen, setIsOpen] = useState(false);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [searchEspaco, setSearchEspaco] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [listPosition, setListPosition] = useState(null);

  const comboRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onThemeCheck = () => setTheme(getCurrentTheme());
    onThemeCheck();
    const observer = new MutationObserver(onThemeCheck);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!token || !unidadeOrganizacionalId) return;
    listarEspacos({ token, unidadeOrganizacionalId, top: 200 })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao listar espaços');
        const data = await res.json();
        setEspacos(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setEspacos([]);
      });
  }, [token, unidadeOrganizacionalId]);

  useEffect(() => {
    if (!token || !unidadeOrganizacionalId) return;
    setLoading(true);

    const carregarDadosPizza = espacoId
      ? listarItensEstoque({
        token,
        unidadeOrganizacionalId,
        top: 1000,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Erro ao carregar itens do espaço');
          const data = await res.json();
          const itensDoEspaco = Array.isArray(data)
            ? data.filter(item => (
              item.espacoId === espacoId &&
              Number(item.tipoUnidadeMedida) === Number(tipoUnidadeMedida)
            ))
            : [];

          return itensDoEspaco.map(item => ({
            label: item.descricao || 'Item sem descrição',
            value: Number(item.quantidade || 0),
          }));
        })
      : obterPizzaDashboard({
        token,
        unidadeOrganizacionalId,
        tipoUnidadeMedida,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Erro ao carregar dashboard');
          return res.json();
        });

    carregarDadosPizza
      .then((data) => setPizzaData(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setPizzaData([]);
      })
      .finally(() => setLoading(false));
  }, [token, unidadeOrganizacionalId, espacoId, tipoUnidadeMedida]);

  useEffect(() => {
    if (!isOpen || !comboRef.current) {
      setListPosition(null);
      return;
    }

    const updateListPosition = () => {
      if (!comboRef.current) return;

      const rect = comboRef.current.getBoundingClientRect();
      const visualViewport = window.visualViewport;
      const viewportGap = 12;
      const viewportBottom = visualViewport
        ? visualViewport.offsetTop + visualViewport.height
        : window.innerHeight;
      const availableHeight = Math.max(120, viewportBottom - rect.bottom - viewportGap);

      setListPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
        width: rect.width,
        maxHeight: Math.min(250, availableHeight)
      });
    };

    updateListPosition();
    window.addEventListener('resize', updateListPosition);
    window.addEventListener('scroll', updateListPosition, true);
    window.visualViewport?.addEventListener('resize', updateListPosition);
    window.visualViewport?.addEventListener('scroll', updateListPosition);

    return () => {
      window.removeEventListener('resize', updateListPosition);
      window.removeEventListener('scroll', updateListPosition, true);
      window.visualViewport?.removeEventListener('resize', updateListPosition);
      window.visualViewport?.removeEventListener('scroll', updateListPosition);
    };
  }, [isOpen]);

  const espacoSelecionado = useMemo(() => {
    return espacos.find((e) => e.espacoId === espacoId) ?? null;
  }, [espacos, espacoId]);

  const espacosFiltrados = useMemo(() => {
    const termo = searchEspaco.trim().toLowerCase();
    if (!termo) return espacos;

    return espacos.filter((espaco) => (
      espaco.nome?.toLowerCase().includes(termo) ||
      espaco.descricao?.toLowerCase().includes(termo)
    ));
  }, [espacos, searchEspaco]);

  const totalEspacoSelecionado = useMemo(() => {
    if (!espacoId || pizzaData.length === 0) return 0;
    return pizzaData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  }, [espacoId, pizzaData]);

  const totalTodosEspacos = useMemo(() => {
    return pizzaData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  }, [pizzaData]);

  const pizzaDataOrdenada = useMemo(() => {
    return [...pizzaData].sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
  }, [pizzaData]);

  const unidadeSelecionadaSigla = getTipoUnidadeSigla(tipoUnidadeMedida);
  const displayEspacoValue = isOpen
    ? searchEspaco
    : espacoSelecionado?.nome || 'Todos os espaços';
  const semEspacosEncontrados = isOpen && searchEspaco.trim() && espacosFiltrados.length === 0;

  const handleSelecionarEspaco = (novoEspacoId) => {
    setEspacoId(novoEspacoId);
    setSearchEspaco('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleEspacoKeyDown = (event) => {
    const optionsLength = espacosFiltrados.length + 1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => (prev < optionsLength - 1 ? prev + 1 : prev));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (isOpen) setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      if (isOpen && highlightedIndex >= 0) {
        event.preventDefault();

        if (highlightedIndex === 0) {
          handleSelecionarEspaco('');
          return;
        }

        const selected = espacosFiltrados[highlightedIndex - 1];
        if (selected) handleSelecionarEspaco(selected.espacoId);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h2 className="page-title no-margin dashboard-page-title">Visão geral do estoque</h2>

        <section className={`space-items-filter-accordion dashboard-filter-section ${filtrosAbertos ? 'is-open' : ''}`}>
          <button
            type="button"
            className="space-items-filter-summary"
            aria-expanded={filtrosAbertos}
            onClick={() => setFiltrosAbertos(prev => !prev)}
          >
            Filtros
          </button>
          <div className="space-items-filter-content">
            <div className="mb-1">
              <label className="label-sm">Espaço</label>
              <div ref={comboRef} className={`zf-combobox zf-combobox-custom-arrow combobox-field ${isOpen ? 'active' : ''}`}>
                <input
                  type="text"
                  placeholder="Pesquisar espaço..."
                  value={displayEspacoValue}
                  onClick={() => setIsOpen(true)}
                  onChange={(event) => {
                    setSearchEspaco(event.target.value);
                    setIsOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleEspacoKeyDown}
                  onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                  className="zf-combobox-input combobox-input"
                />

                {isOpen && listPosition && createPortal(
                  <ul
                    className="zf-combobox-list zf-combobox-list-floating is-open"
                    ref={listRef}
                    style={{
                      top: `${listPosition.top}px`,
                      left: `${listPosition.left}px`,
                      width: `${listPosition.width}px`,
                      maxHeight: `${listPosition.maxHeight}px`
                    }}
                  >
                    <li
                      className={`zf-combobox-item ${highlightedIndex === 0 ? 'highlighted' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelecionarEspaco('')}
                      onMouseEnter={() => setHighlightedIndex(0)}
                    >
                      <div className="zf-cb-left">
                        <span className="zf-cb-name">Todos os espaços</span>
                      </div>
                    </li>

                    {espacosFiltrados.map((espaco, index) => (
                      <li
                        key={espaco.espacoId}
                        className={`zf-combobox-item ${highlightedIndex === index + 1 ? 'highlighted' : ''}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelecionarEspaco(espaco.espacoId)}
                        onMouseEnter={() => setHighlightedIndex(index + 1)}
                      >
                        <div className="zf-cb-left">
                          <span className="zf-cb-name">{espaco.nome}</span>
                          {espaco.descricao && <span className="zf-cb-cpf">{espaco.descricao}</span>}
                        </div>
                      </li>
                    ))}

                    {espacos.length === 0 && (
                      <li className="zf-combobox-empty" aria-live="polite">
                        Nenhum espaço cadastrado
                      </li>
                    )}

                    {semEspacosEncontrados && (
                      <li className="zf-combobox-empty" aria-live="polite">
                        Não encontrado
                      </li>
                    )}
                  </ul>,
                  document.body
                )}
              </div>
            </div>

            <div className="space-items-unit-filter" role="radiogroup" aria-label="Filtrar por unidade de medida">
              {TIPOS_UNIDADE_FILTRO.map(unidade => (
                <label key={unidade.value} className="space-items-unit-option">
                  <input
                    type="radio"
                    name="tipoUnidadeMedidaDashboard"
                    value={unidade.value}
                    checked={Number(tipoUnidadeMedida) === unidade.value}
                    onChange={() => setTipoUnidadeMedida(unidade.value)}
                  />
                  <span>{unidade.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-page-scroll">
        <div className="dashboard-layout">
          <section className="card inventory-card inventory-card-surface dashboard-summary-card">
            <div className="dashboard-summary-chart">
              {loading && (
                <LoadingWaves variant="dashboard" rows={1} label="Carregando dados do dashboard" />
              )}

              {!loading && pizzaData.length === 0 && (
                <p className="dashboard-body-text dashboard-text-center">
                  Não há dados para exibir com o filtro selecionado.
                </p>
              )}

              {!loading && pizzaData.length > 0 && (
                <PizzaDashboardChart data={pizzaData} theme={theme} unidade={unidadeSelecionadaSigla} />
              )}
            </div>

            <div className="dashboard-totals-section">
              <h3 className="inventory-card-title dashboard-card-title dashboard-card-title-center dashboard-card-title-nowrap dashboard-card-title-fixed">
                {espacoId ? 'Totais por item' : 'Totais por espaço'}
              </h3>

              {loading && (
                <LoadingWaves variant="dashboard" rows={1} label="Carregando totais" />
              )}

              {!loading && pizzaData.length === 0 && (
                <p className="dashboard-body-text dashboard-text-center">
                  Sem dados para exibir.
                </p>
              )}

              {!loading && pizzaData.length > 0 && (
                <>
                  <div className="totais-scroll dashboard-totals-scroll">
                    <ul className="dashboard-totals-list">
                      {pizzaDataOrdenada.map((item, index) => (
                        <li
                          key={`${item.label}-${index}`}
                          className="dashboard-totals-item"
                        >
                          <span
                            className="dashboard-totals-label"
                            title={item.label}
                          >
                            {item.label}
                          </span>
                          <span className="dashboard-totals-value">
                            {formatQuantityMasked(item.value)} {unidadeSelecionadaSigla}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <ul className="dashboard-totals-list dashboard-totals-footer">
                    <li className="dashboard-totals-item dashboard-totals-summary">
                      <span className="dashboard-totals-label">
                        Total geral
                      </span>
                      <span className="dashboard-totals-value">
                        {formatQuantityMasked(espacoId ? totalEspacoSelecionado : totalTodosEspacos)} {unidadeSelecionadaSigla}
                      </span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
