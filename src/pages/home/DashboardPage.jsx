// src/pages/home/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { listarEspacos } from '../../services/espacoService';
import { obterPizzaDashboard } from '../../services/relatorioService';
import PizzaChartRecharts from '../../components/charts/PizzaChartRecharts';

export default function DashboardPage({ token, unidadeOrganizacionalId }) {
  const [espacos, setEspacos] = useState([]);
  const [espacoId, setEspacoId] = useState('');
  const [tipoUnidadeMedida, setTipoUnidadeMedida] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1) Carrega espaços para o select
  useEffect(() => {
    async function carregarEspacos() {
      try {
        const resp = await listarEspacos({ token, unidadeOrganizacionalId });
        if (!resp.ok) throw new Error('Erro ao listar espaços');
        const json = await resp.json();
        setEspacos(json);
      } catch (err) {
        console.error(err);
      }
    }

    if (token && unidadeOrganizacionalId) {
      carregarEspacos();
    }
  }, [token, unidadeOrganizacionalId]);

  // 2) Carrega dados da pizza sempre que filtros mudarem
  useEffect(() => {
    async function carregarPizza() {
      setLoading(true);
      try {
        const resp = await obterPizzaDashboard({
          token,
          unidadeOrganizacionalId,
          espacoId: espacoId || undefined,
          tipoUnidadeMedida:
            tipoUnidadeMedida !== '' ? Number(tipoUnidadeMedida) : undefined,
        });
        if (!resp.ok) throw new Error('Erro ao obter dashboard');
        const json = await resp.json(); // [{ label, value }]
        setData(json);
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    if (token && unidadeOrganizacionalId) {
      carregarPizza();
    }
  }, [token, unidadeOrganizacionalId, espacoId, tipoUnidadeMedida]);

  return (
    <div className="dashboard-page">
      {/* Header antigo do HomeHero, reaproveitado */}
      <header className="home-hero">
        <img src="/logo-zenite.png" alt="Logo Zênite" className="home-logo" />
        <h2 className="home-subtitle">Bem-vindo ao Estoque Certo.</h2>
      </header>

      {/* Filtros */}
      <section className="dashboard-filters">
        <div>
          <label>Espaço</label>
          <select value={espacoId} onChange={e => setEspacoId(e.target.value)}>
            <option value="">Todos</option>
            {espacos.map(e => (
              <option key={e.espacoId} value={e.espacoId}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Tipo de Unidade</label>
          <select
            value={tipoUnidadeMedida}
            onChange={e => setTipoUnidadeMedida(e.target.value)}
          >
            <option value="">Todos</option>
            {/* Ajuste os valores conforme seu enum TipoUnidadeMedida no back */}
            <option value="0">Unidade</option>
            <option value="1">Caixa</option>
            <option value="2">Kg</option>
          </select>
        </div>
      </section>

      {/* Gráfico */}
      <section className="dashboard-chart">
        {loading && <p>Carregando...</p>}
        {!loading && data.length === 0 && (
          <p>Sem dados para os filtros selecionados.</p>
        )}
        {!loading && data.length > 0 && <PizzaChartRecharts data={data} />}
      </section>
    </div>
  );
}