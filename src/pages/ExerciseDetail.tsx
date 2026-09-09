import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { getExerciseHistory, getPersonalRecord, getExerciseTrend } from '../lib/stats';
import { Card, EmptyState } from '../components/ui';
import { chartColors, tooltipStyle } from '../lib/chartTheme';

export function ExerciseDetail() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { sessions, exercises } = useAppData();

  const exercise = exercises.find((e) => e.id === exerciseId);
  const history = getExerciseHistory(sessions, exerciseId ?? '');
  const pr = getPersonalRecord(sessions, exerciseId ?? '');
  const trend = getExerciseTrend(sessions, exerciseId ?? '');

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: h.maxWeight,
    volume: Math.round(h.volume),
  }));

  const trendMeta = {
    up: { icon: TrendingUp, label: 'Em evolução', color: chartColors.status.good },
    down: { icon: TrendingDown, label: 'Em queda', color: chartColors.categorical.red },
    flat: { icon: Minus, label: 'Estável', color: chartColors.axis },
    unknown: { icon: Minus, label: 'Poucos dados', color: chartColors.axis },
  }[trend];

  return (
    <div className="px-4">
      <div className="flex items-center gap-2 pt-5 pb-3">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1" style={{ color: 'var(--text-dim)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold truncate">{exercise?.name ?? 'Exercício'}</h1>
      </div>

      {!pr ? (
        <EmptyState title="Sem histórico ainda" subtitle="Registre esse exercício em um treino para ver sua evolução." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Card className="flex flex-col items-center py-3.5">
              <p className="text-xl font-semibold">{pr.maxWeight}kg</p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                recorde ({pr.maxWeightReps} reps)
              </p>
            </Card>
            <Card className="flex flex-col items-center py-3.5">
              <p className="text-xl font-semibold">{pr.estimated1RM}kg</p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                1RM estimado
              </p>
            </Card>
          </div>

          <Card className="mb-4 flex items-center gap-2 py-3">
            <trendMeta.icon size={16} style={{ color: trendMeta.color }} />
            <span className="text-sm" style={{ color: trendMeta.color }}>
              {trendMeta.label}
            </span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-faint)' }}>
              vs. sessão anterior
            </span>
          </Card>

          <Card className="mb-4">
            <p className="text-sm font-medium mb-3">Progressão de carga (kg)</p>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                  <CartesianGrid stroke={chartColors.gridline} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
                  <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: chartColors.textSecondary }}
                    formatter={(value) => [`${value}kg`, 'Peso máx.']}
                    cursor={{ stroke: chartColors.gridline }}
                  />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke={chartColors.categorical.blue}
                    strokeWidth={2}
                    strokeLinecap="round"
                    dot={{ r: 3, fill: chartColors.categorical.blue, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="mb-6">
            <p className="text-sm font-medium mb-3">Volume por sessão (kg totais)</p>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                  <CartesianGrid stroke={chartColors.gridline} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
                  <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: chartColors.textSecondary }}
                    formatter={(value) => [`${value}kg`, 'Volume']}
                    cursor={{ stroke: chartColors.gridline }}
                  />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke={chartColors.categorical.aqua}
                    strokeWidth={2}
                    strokeLinecap="round"
                    dot={{ r: 3, fill: chartColors.categorical.aqua, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
