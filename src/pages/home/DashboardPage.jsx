import { useEffect, useMemo, useState } from 'react';
import { listarEspacos } from '../../services/espacoService';
import { obterPizzaDashboard } from '../../services/relatorioService';
import PizzaDashboardChart from '../../components/charts/PizzaDashboardChart';

const dashboardThemeStyle = `
  .totais-scroll {
    scrollbar-width: thin;
  }

  html[data-theme='dark'] .totais-scroll {
    scrollbar-color: #d4a017 transparent;
  }

  html[data-theme='light'] .totais-scroll {
    scrollbar-color: #1565c0 transparent;
  }

  html[data-theme='dark'] .totais-scroll::-webkit-scrollbar,
  html[data-theme='light'] .totais-scroll::-webkit-scrollbar {
    width: 8px;
  }

  html[data-theme='dark'] .totais-scroll::-webkit-scrollbar-track,
  html[data-theme='light'] .totais-scroll::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }

  html[data-theme='dark'] .totais-scroll::-webkit-scrollbar-thumb {
    background-color: #d4a017;
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  html[data-theme='light'] .totais-scroll::-webkit-scrollbar-thumb {
    background-color: #1565c0;
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  html[data-theme='dark'] .totais-scroll::-webkit-scrollbar-thumb:hover {
    background-color: #f2c94c;
  }

  html[data-theme='light'] .totais-scroll::-webkit-scrollbar-thumb:hover {
    background-color: #0d47a1;
  }

  .dashboard-select {
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    border-radius: 10px;
    padding: 0.9rem 1rem;
    font-size: 1rem;
    outline: none;
  }

  html[data-theme='dark'] .dashboard-select {
    background-color: #0d2a5c;
    color: #f8fafc;
    border: 1px solid #d4a017;
  }

  html[data-theme='light'] .dashboard-select {
    background-color: #ffffff;
    color: #111827;
    border: 1px solid #1565c0;
  }

  html[data-theme='dark'] .dashboard-select option {
    background-color: #0b2550;
    color: #f8fafc;
  }

  html[data-theme='light'] .dashboard-select option {
    background-color: #ffffff;
    color: #111827;
  }
`;

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export default function DashboardPage({ token, unidadeOrganizacionalId }) {
  const [espacos, setEspacos] = useState([]);
  const [espacoId, setEspacoId] = useState('');
  const [pizzaData, setPizzaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(getCurrentTheme());

  useEffect(() => {
    const existing = document.getElementById('dashboard-theme-style');
    if (!existing) {
      const styleTag = document.createElement('style');
      styleTag.id = 'dashboard-theme-style';
      styleTag.textContent = dashboardThemeStyle;
      document.head.appendChild(styleTag);
    }
  }, []);

  useEffect(() => {
    const onThemeCheck = () => {
      setTheme(getCurrentTheme());
    };

    onThemeCheck();

    const observer = new MutationObserver(() => {
      onThemeCheck();
    });

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
      console.log('pizzaData =>', data);
      setPizzaData(Array.isArray(data) ? data : []);
    })
    .catch((err) => {
      console.error(err);
      setPizzaData([]);
    })
    .finally(() => {
      setLoading(false);
    });
}, [token, unidadeOrganizacionalId, espacoId]);

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

  const isLight = theme === 'light';

  const cardTitleStyle = {
    marginBottom: '0.9rem',
    fontWeight: 800,
    fontSize: '1.05rem',
    color: isLight ? '#111827' : '#F8FAFC',
    lineHeight: 1.2,
  };

  const bodyTextStyle = {
    color: isLight ? '#374151' : '#E5E7EB',
  };

  const quantityTextStyle = {
    color: isLight ? '#4B5563' : '#D1D5DB',
    fontWeight: 500,
  };

  return (
    <div className="dashboard-page" style={{ width: '100%' }}>
      <div
        className="dashboard-layout"
        style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'stretch',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <section
          className="card inventory-card inventory-card-surface"
          style={{
            flex: '1 1 58%',
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
          }}
        >
          <h3
            className="inventory-card-title"
            style={{
              ...cardTitleStyle,
              textAlign: 'center',
              width: '100%',
            }}
          >
            Visão geral do estoque
          </h3>

          {loading && <p style={bodyTextStyle}>Carregando dados do dashboard...</p>}

          {!loading && pizzaData.length === 0 && (
            <p style={bodyTextStyle}>
              Não há dados para exibir com o filtro selecionado.
            </p>
          )}

          {!loading && pizzaData.length > 0 && (
            <PizzaDashboardChart data={pizzaData} theme={theme} />
          )}
        </section>

        <section
          style={{
            flex: '1 1 38%',
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div
            className="card inventory-card inventory-card-surface"
            style={{ padding: '1.25rem' }}
          >
            <h3
              className="inventory-card-title"
              style={{
                ...cardTitleStyle,
                whiteSpace: 'nowrap',
                overflow: 'visible',
              }}
            >
              Espaço
            </h3>

            <select
              id="espaco"
              value={espacoId}
              onChange={(e) => setEspacoId(e.target.value)}
              className="dashboard-select"
            >
              <option value="">Todos os espaços</option>
              {espacos.map((e) => (
                <option key={e.espacoId} value={e.espacoId}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>

          <div
            className="card inventory-card inventory-card-surface"
            style={{
              padding: '1.25rem',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3
              className="inventory-card-title"
              style={{
                ...cardTitleStyle,
                whiteSpace: 'nowrap',
                overflow: 'visible',
                flexShrink: 0,
              }}
            >
              {espacoId ? 'Total do espaço' : 'Totais por espaço'}
            </h3>

            {loading && <p style={bodyTextStyle}>Carregando totais...</p>}

            {!loading && pizzaData.length === 0 && (
              <p style={bodyTextStyle}>Sem dados para exibir.</p>
            )}

            {!loading && !espacoId && pizzaData.length > 0 && (
              <div
                className="totais-scroll"
                style={{
                  overflowY: 'auto',
                  maxHeight: '240px',
                  minHeight: '240px',
                  paddingRight: '0.5rem',
                }}
              >
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {pizzaDataOrdenada.map((item, index) => (
                    <li
                      key={`${item.label}-${index}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: '0.75rem',
                        marginBottom: '0.7rem',
                      }}
                    >
                      <span
                        style={{
                          flex: '1 1 auto',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: isLight ? '#111827' : '#F8FAFC',
                          fontWeight: 400,
                        }}
                        title={item.label}
                      >
                        {item.label}
                      </span>

                      <span
                        style={{
                          ...quantityTextStyle,
                          flex: '0 0 auto',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {Number(item.value)} litros
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!loading && espacoId && espacoSelecionado && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  ...bodyTextStyle,
                }}
              >
                <p style={{ margin: 0 }}>
                  <strong style={{ color: isLight ? '#111827' : '#F8FAFC' }}>
                    {espacoSelecionado.nome}
                  </strong>
                </p>
                <p style={{ margin: 0 }}>
                  Quantidade total:{' '}
                  <strong style={{ color: isLight ? '#111827' : '#F8FAFC' }}>
                    {totalEspacoSelecionado}
                  </strong>{' '}
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