import { useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const DARK_PALETTE = [
  '#1565C0', 
  '#D4A017', 
  '#1976D2', 
  '#F9A825', 
  '#0D47A1', 
  '#FFD54F', 
  '#1E88E5', 
  '#F59E0B', 
  '#42A5F5', 
  '#FFC107',
  '#1565C0AA', 
  '#D4A017AA',
];

const LIGHT_PALETTE = [
  '#1565C0',
  '#1E88E5',
  '#0D47A1',
  '#42A5F5',
  '#9CA3AF',
  '#6B7280',
  '#D1D5DB',
  '#4B5563',
  '#93C5FD',
  '#BFC7D5',
  '#7C8CA5',
  '#E5E7EB',
];

export default function PizzaDashboardChart({ data, theme = 'dark' }) {
  const [hiddenItems, setHiddenItems] = useState({});
  const [outlinedItems, setOutlinedItems] = useState({});

  const isLight = theme === 'light';
  const palette = isLight ? LIGHT_PALETTE : DARK_PALETTE;
  const legendColor = isLight ? '#4B5563' : '#E5E7EB';
  const outlineColor = isLight ? '#000000' : '#000000';

  useEffect(() => {
    setHiddenItems({});
    setOutlinedItems({});
  }, [data]);

  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.label),
      datasets: [
        {
          data: data.map((d, index) => (hiddenItems[index] ? 0 : Number(d.value))),
          backgroundColor: data.map((_, i) => palette[i % palette.length]),
          borderColor: data.map((_, index) =>
            outlinedItems[index]
              ? outlineColor
              : isLight
                ? '#F3F4F6'
                : 'rgba(255,255,255,0.08)'
          ),
          borderWidth: data.map((_, index) => (outlinedItems[index] ? 5 : 2)),
          hoverOffset: 6,
        },
      ],
    };
  }, [data, hiddenItems, outlinedItems, palette, outlineColor, isLight]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          onClick: null,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed} litros`,
          },
        },
      },
      cutout: '62%',
    };
  }, []);

  const handleColorClick = (event, index) => {
    event.preventDefault();
    event.stopPropagation();

    setOutlinedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleTextClick = (event, index) => {
    event.preventDefault();
    event.stopPropagation();

    setHiddenItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', height: 340, minHeight: 280 }}>
        <Doughnut data={chartData} options={options} />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0.85rem 1.2rem',
          marginTop: '1rem',
        }}
      >
        {data.map((item, index) => {
          const color = palette[index % palette.length];
          const isHidden = !!hiddenItems[index];
          const isOutlined = !!outlinedItems[index];

          return (
            <div
              key={`${item.label}-${index}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                opacity: isHidden ? 0.55 : 1,
              }}
            >
              <button
                type="button"
                onClick={(event) => handleColorClick(event, index)}
                title="Contornar fatia no gráfico"
                style={{
                  width: 14,
                  height: 14,
                  minWidth: 14,
                  minHeight: 14,
                  borderRadius: 2,
                  backgroundColor: color,
                  border: isOutlined ? `2px solid ${outlineColor}` : '1px solid transparent',
                  boxShadow: isOutlined ? `0 0 0 2px ${outlineColor}33` : 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />

              <button
                type="button"
                onClick={(event) => handleTextClick(event, index)}
                title="Mostrar ou ocultar espaço no gráfico"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  color: legendColor,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textDecoration: isHidden ? 'line-through' : 'none',
                }}
              >
                {item.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}