import { useEffect, useMemo, useRef, useState } from 'react';
import PizzaDashboardChart from '../../components/charts/PizzaDashboardChart';
import { listarEspacos } from '../../services/espacoService';
import { obterPizzaDashboard } from '../../services/relatorioService';

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export default function DashboardPage({ token, unidadeOrganizacionalId }) {
  const [espacos, setEspacos] = useState([]);
  const [espacoId, setEspacoId] = useState('');
  const [pizzaData, setPizzaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(getCurrentTheme());
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

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

    obterPizzaDashboard({
      token,
      unidadeOrganizacionalId,
      espacoId: espacoId || undefined,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao carregar dashboard');
        const data = await res.json();
        setPizzaData(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setPizzaData([]);
      })
      .finally(() => setLoading(false));
  }, [token, unidadeOrganizacionalId, espacoId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const espacoSelecionado = useMemo(() => {
    return espacos.find((e) => e.espacoId === espacoId) ?? null;
  }, [espacos, espacoId]);

  const totalEspacoSelecionado = useMemo(() => {
    if (!espacoId || pizzaData.length === 0) return 0;
    return pizzaData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  }, [espacoId, pizzaData]);

  const pizzaDataOrdenada = useMemo(() => {
    return [...pizzaData].sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
  }, [pizzaData]);

  const handleSelecionarEspaco = (novoEspacoId) => {
    setEspacoId(novoEspacoId);
    setIsOpen(false);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <section className="card inventory-card inventory-card-surface dashboard-chart-card">
          <h3 className="inventory-card-title dashboard-card-title dashboard-card-title-center">
            Visão geral do estoque
          </h3>

          {loading && (
            <p className="dashboard-body-text dashboard-text-center">
              Carregando dados do dashboard...
            </p>
          )}

          {!loading && pizzaData.length === 0 && (
            <p className="dashboard-body-text dashboard-text-center">
              Não há dados para exibir com o filtro selecionado.
            </p>
          )}

          {!loading && pizzaData.length > 0 && (
            <PizzaDashboardChart data={pizzaData} theme={theme} />
          )}
        </section>

        <section className="dashboard-side-column">
          <div className="card inventory-card inventory-card-surface dashboard-filter-card">
            <h3 className="inventory-card-title dashboard-card-title dashboard-card-title-nowrap">
              Espaço
            </h3>

            <div
              ref={dropdownRef}
              className="dashboard-select-wrapper"
            >
              <button
                type="button"
                className="dashboard-select-trigger"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
              >
                <span>
                  {espacoId
                    ? espacos.find((e) => e.espacoId === espacoId)?.nome ?? 'Todos os espaços'
                    : 'Todos os espaços'}
                </span>

                <svg
                  className="dashboard-select-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isOpen && (
                <ul className="dashboard-select-menu">
                  <li
                    className={`dashboard-select-option${!espacoId ? ' dashboard-select-option-active' : ''}`}
                    onClick={() => handleSelecionarEspaco('')}
                  >
                    Todos os espaços
                  </li>

                  {espacos.length === 0 && (
                    <li className="dashboard-select-option dashboard-select-option-empty">
                      Nenhum espaço cadastrado
                    </li>
                  )}

                  {espacos.map((e) => (
                    <li
                      key={e.espacoId}
                      className={`dashboard-select-option${espacoId === e.espacoId ? ' dashboard-select-option-active' : ''}`}
                      onClick={() => handleSelecionarEspaco(e.espacoId)}
                    >
                      {e.nome}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card inventory-card inventory-card-surface dashboard-totals-card">
            <h3 className="inventory-card-title dashboard-card-title dashboard-card-title-center dashboard-card-title-nowrap dashboard-card-title-fixed">
              {espacoId ? 'Total do espaço' : 'Totais por espaço'}
            </h3>

            {loading && (
              <p className="dashboard-body-text dashboard-text-center">
                Carregando totais...
              </p>
            )}

            {!loading && pizzaData.length === 0 && (
              <p className="dashboard-body-text dashboard-text-center">
                Sem dados para exibir.
              </p>
            )}

            {!loading && !espacoId && pizzaData.length > 0 && (
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
                        {Number(item.value)} litros
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!loading && espacoId && espacoSelecionado && (
              <div className="dashboard-selected-total dashboard-body-text">
                <p>
                  <strong>{espacoSelecionado.nome}</strong>
                </p>
                <p>
                  Quantidade total:{' '}
                  <strong>{totalEspacoSelecionado}</strong>{' '}
                  litros
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}