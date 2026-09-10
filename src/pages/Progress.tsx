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
import { Target, Pencil, X } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { getWeeklyFrequency } from '../lib/stats';
import { assessWeightGoal } from '../lib/goal';
import { setWeightGoal } from '../lib/actions';
import { PageHeader, Card, EmptyState, Button } from '../components/ui';
import { chartColors, seriesOrder, tooltipStyle } from '../lib/chartTheme';
import type { BodyMeasurement, CardioLog, Session, WeeklySchedule, WeightGoal } from '../types';

const MEASURE_FIELDS: { key: 'chestCm' | 'waistCm' | 'hipCm' | 'armCm' | 'thighCm'; label: string }[] = [
  { key: 'waistCm', label: 'Cintura' },
  { key: 'chestCm', label: 'Peito' },
  { key: 'armCm', label: 'Braço' },
  { key: 'thighCm', label: 'Coxa' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const VERDICT_COLOR: Record<string, string> = {
  'no-caminho': 'var(--success)',
  atencao: 'var(--warn)',
  'fora-do-ritmo': 'var(--danger)',
  cedo: 'var(--text-dim)',
  'sem-dados': 'var(--text-dim)',
};

function WeightGoalCard({
  goal,
  measurements,
  sessions,
  cardioLogs,
  weeklySchedule,
}: {
  goal: WeightGoal | null;
  measurements: BodyMeasurement[];
  sessions: Session[];
  cardioLogs: CardioLog[];
  weeklySchedule: WeeklySchedule;
}) {
  const [editing, setEditing] = useState(goal === null);
  const lastWeight = measurements
    .filter((m) => m.weightKg != null)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg;

  const [form, setForm] = useState({
    startWeightKg: goal ? String(goal.startWeightKg) : lastWeight != null ? String(lastWeight) : '',
    targetLossKg: goal ? String(goal.targetLossKg) : '',
    targetWeeks: goal ? String(goal.targetWeeks) : '',
  });

  function handleSave() {
    const startWeightKg = Number(form.startWeightKg);
    const targetLossKg = Number(form.targetLossKg);
    const targetWeeks = Number(form.targetWeeks);
    if (!startWeightKg || !targetLossKg || !targetWeeks) return;
    setWeightGoal({ startWeightKg, targetLossKg, targetWeeks, startDate: goal?.startDate ?? todayIso() });
    setEditing(false);
  }

  if (editing) {
    return (
      <Card className="mb-4">
        <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
          <Target size={15} style={{ color: 'var(--brand)' }} /> Meta de perda de peso
        </p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>
          Estimativa geral pra te ajudar a planejar — não substitui orientação médica ou nutricional.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Peso atual (kg)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={form.startWeightKg}
              onChange={(e) => setForm({ ...form, startWeightKg: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface-2)' }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Quer perder (kg)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={form.targetLossKg}
              onChange={(e) => setForm({ ...form, targetLossKg: e.target.value })}
              placeholder="Ex: 5"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface-2)' }}
            />
          </label>
          <label className="flex flex-col gap-1 col-span-2">
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Em quantas semanas (~)
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={form.targetWeeks}
              onChange={(e) => setForm({ ...form, targetWeeks: e.target.value })}
              placeholder="Ex: 10"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface-2)' }}
            />
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            full
            disabled={!form.startWeightKg || !form.targetLossKg || !form.targetWeeks}
            onClick={handleSave}
          >
            {goal ? 'Salvar alterações' : 'Definir meta'}
          </Button>
          {goal && (
            <Button variant="secondary" onClick={() => setEditing(false)} className="!px-4">
              Cancelar
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const assessment = assessWeightGoal(goal as WeightGoal, measurements, sessions, cardioLogs, weeklySchedule);
  const g = goal as WeightGoal;
  const targetWeightKg = g.startWeightKg - g.targetLossKg;

  return (
    <Card className="mb-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Target size={15} style={{ color: 'var(--brand)' }} /> Meta de perda de peso
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} style={{ color: 'var(--text-faint)' }}>
            <Pencil size={14} />
          </button>
          <button onClick={() => setWeightGoal(null)} style={{ color: 'var(--text-faint)' }}>
            <X size={15} />
          </button>
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>
        {g.startWeightKg}kg → {targetWeightKg.toFixed(1)}kg em ~{g.targetWeeks} semanas ({assessment.targetWeeklyRateKg.toFixed(2)}kg/semana)
      </p>

      <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
        {assessment.pace.message}
      </p>

      <div
        className="rounded-xl p-3 text-sm mb-2"
        style={{ background: 'var(--surface-2)', color: VERDICT_COLOR[assessment.verdict] ?? 'var(--text)' }}
      >
        {assessment.verdictMessage}
      </div>

      {assessment.consistencyPct != null && (
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Frequência de treino (últimas semanas) vs agenda planejada: {assessment.consistencyPct}%
        </p>
      )}
    </Card>
  );
}

export function Progress() {
  const { sessions, measurements, cardioLogs, weeklySchedule, weightGoal } = useAppData();
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

  if (!hasAnyData && !weightGoal) {
    return (
      <div className="px-4 pb-6">
        <PageHeader title="Evolução" />
        <WeightGoalCard
          goal={weightGoal}
          measurements={measurements}
          sessions={sessions}
          cardioLogs={cardioLogs}
          weeklySchedule={weeklySchedule}
        />
        <EmptyState title="Ainda sem dados" subtitle="Complete treinos e registre medidas para ver seus gráficos aqui." />
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <PageHeader title="Evolução" />

      <WeightGoalCard
        goal={weightGoal}
        measurements={measurements}
        sessions={sessions}
        cardioLogs={cardioLogs}
        weeklySchedule={weeklySchedule}
      />

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
