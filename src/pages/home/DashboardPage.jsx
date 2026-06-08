import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const dropdownAnchorRef = useRef(null);
  const dropdownMenuRef = useRef(null);

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
    if (!isOpen || !dropdownAnchorRef.current) return;

    const calcPos = () => {
      if (!dropdownAnchorRef.current) return;
      const rect = dropdownAnchorRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    calcPos();

    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);

    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      const clickedAnchor = dropdownAnchorRef.current?.contains(e.target);
      const clickedMenu = dropdownMenuRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedMenu) {
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

  const handleSelecionarEspaco = (novoEspacoId) => {
    setEspacoId(novoEspacoId);
    setIsOpen(false);
  };

  const dropdownPortal = isOpen
    ? createPortal(
        <ul
          ref={dropdownMenuRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 99999,
            margin: 0,
            padding: '0.25rem 0',
            listStyle: 'none',
            borderRadius: '10px',
            border: `1px solid ${isLight ? '#1565c0' : '#d4a017'}`,
            backgroundColor: isLight ? '#ffffff' : '#0b2550',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          <li
            onClick={() => handleSelecionarEspaco('')}
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: isLight ? '#111827' : '#f8fafc',
              backgroundColor: !espacoId
                ? (isLight ? '#e8f0fe' : '#1a3a7c')
                : 'transparent',
            }}
          >
            Todos os espaços
          </li>

          {espacos.length === 0 && (
            <li
              style={{
                padding: '0.75rem 1rem',
                color: isLight ? '#9ca3af' : '#6b7280',
                cursor: 'default',
                fontStyle: 'italic',
              }}
            >
              Nenhum espaço cadastrado
            </li>
          )}

          {espacos.map((e) => (
            <li
              key={e.espacoId}
              onClick={() => handleSelecionarEspaco(e.espacoId)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                color: isLight ? '#111827' : '#f8fafc',
                backgroundColor: espacoId === e.espacoId
                  ? (isLight ? '#e8f0fe' : '#1a3a7c')
                  : 'transparent',
              }}
            >
              {e.nome}
            </li>
          ))}
        </ul>,
        document.body
      )
    : null;

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
            style={{ ...cardTitleStyle, textAlign: 'center', width: '100%' }}
          >
            Visão geral do estoque
          </h3>

          {loading && (
            <p style={{ ...bodyTextStyle, textAlign: 'center' }}>
              Carregando dados do dashboard...
            </p>
          )}

          {!loading && pizzaData.length === 0 && (
            <p style={{ ...bodyTextStyle, textAlign: 'center' }}>
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
              style={{ ...cardTitleStyle, whiteSpace: 'nowrap', overflow: 'visible' }}
            >
              Espaço
            </h3>

            <div
              ref={dropdownAnchorRef}
              onClick={() => setIsOpen((prev) => !prev)}
              style={{
                width: '100%',
                borderRadius: '10px',
                padding: '0.9rem 2.8rem 0.9rem 1rem',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none',
                backgroundColor: isLight ? '#ffffff' : '#0d2a5c',
                color: isLight ? '#111827' : '#f8fafc',
                border: `1px solid ${isLight ? '#1565c0' : '#d4a017'}`,
                boxSizing: 'border-box',
              }}
            >
              <span>
                {espacoId
                  ? espacos.find((e) => e.espacoId === espacoId)?.nome ?? 'Todos os espaços'
                  : 'Todos os espaços'}
              </span>

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  flexShrink: 0,
                  transition: 'transform 0.2s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: isLight ? '#1565c0' : '#d4a017',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {dropdownPortal}
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
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'visible',
                flexShrink: 0,
              }}
            >
              {espacoId ? 'Total do espaço' : 'Totais por espaço'}
            </h3>

            {loading && (
              <p style={{ ...bodyTextStyle, textAlign: 'center' }}>
                Carregando totais...
              </p>
            )}

            {!loading && pizzaData.length === 0 && (
              <p style={{ ...bodyTextStyle, textAlign: 'center' }}>
                Sem dados para exibir.
              </p>
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
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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