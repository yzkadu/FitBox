import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { getWeeklyFrequency } from '../lib/stats';
import { PageHeader, Card, EmptyState } from '../components/ui';
import { chartColors, seriesOrder, tooltipStyle } from '../lib/chartTheme';

const MEASURE_FIELDS: { key: 'chestCm' | 'waistCm' | 'hipCm' | 'armCm' | 'thighCm'; label: string }[] = [
  { key: 'waistCm', label: 'Cintura' },
  { key: 'chestCm', label: 'Peito' },
  { key: 'armCm', label: 'Braço' },
  { key: 'thighCm', label: 'Coxa' },
];

export function Progress() {
  const { sessions, measurements } = useAppData();
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set(['waistCm']));

  const freq = useMemo(() => getWeeklyFrequency(sessions, 10), [sessions]);
  const freqData = freq.map((f) => ({
    week: new Date(f.weekStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    treinos: f.count,
  }));

  const weightData = measurements
    .filter((m) => m.weightKg != null)
    .map((m) => ({ date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), peso: m.weightKg }));

  const measureData = measurements.map((m) => {
    const point: Record<string, number | string> = {
      date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    };
    MEASURE_FIELDS.forEach((f) => {
      if (m[f.key] != null) point[f.key] = m[f.key] as number;
    });
    return point;
  });

  function toggleField(key: string) {
    setActiveFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const hasAnyData = sessions.some((s) => s.finishedAt) || measurements.length > 0;

  if (!hasAnyData) {
    return (
      <div className="px-4">
        <PageHeader title="Evolução" />
        <EmptyState title="Ainda sem dados" subtitle="Complete treinos e registre medidas para ver seus gráficos aqui." />
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <PageHeader title="Evolução" />

      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Frequência de treino (10 semanas)</p>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={freqData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={chartColors.gridline} vertical={false} />
              <XAxis dataKey="week" tick={{ fill: chartColors.axis, fontSize: 10 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={38} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: chartColors.textSecondary }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(value) => [value, 'Treinos']}
              />
              <Bar dataKey="treinos" fill={chartColors.categorical.blue} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {weightData.length > 0 && (
        <Card className="mb-4">
          <p className="text-sm font-medium mb-3">Peso corporal (kg)</p>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid stroke={chartColors.gridline} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
                <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={38} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: chartColors.textSecondary }}
                  formatter={(value) => [`${value}kg`, 'Peso']}
                  cursor={{ stroke: chartColors.gridline }}
                />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke={chartColors.categorical.violet}
                  strokeWidth={2}
                  strokeLinecap="round"
                  dot={{ r: 3, fill: chartColors.categorical.violet, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {measurements.length > 0 && (
        <Card className="mb-4">
          <p className="text-sm font-medium mb-2">Medidas corporais (cm)</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MEASURE_FIELDS.map((f, i) => {
              const on = activeFields.has(f.key);
              const color = seriesOrder[i % seriesOrder.length];
              return (
                <button
                  key={f.key}
                  onClick={() => toggleField(f.key)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full"
                  style={{
                    background: on ? `${color}26` : 'var(--surface-2)',
                    color: on ? color : 'var(--text-faint)',
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {f.label}
                </button>
              );
            })}
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={measureData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid stroke={chartColors.gridline} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
                <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={38} domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chartColors.textSecondary }} cursor={{ stroke: chartColors.gridline }} />
                {MEASURE_FIELDS.filter((f) => activeFields.has(f.key)).map((f) => (
                  <Line
                    key={f.key}
                    type="monotone"
                    dataKey={f.key}
                    name={f.label}
                    stroke={seriesOrder[MEASURE_FIELDS.findIndex((x) => x.key === f.key) % seriesOrder.length]}
                    strokeWidth={2}
                    strokeLinecap="round"
                    dot={{ r: 3, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
