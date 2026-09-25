import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  ReferenceArea,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Target, Pencil, X, Flame, CalendarCheck, Scale, Activity } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { getWeeklyFrequency, getCurrentStreakDays, getTotalSessionsThisMonth } from '../lib/stats';
import { assessWeightGoal } from '../lib/goal';
import { setWeightGoal } from '../lib/actions';
import { calcImc, classifyImc, healthyWeightRangeKg } from '../lib/imc';
import { PageHeader, Card, EmptyState, Button, Pill } from '../components/ui';
import { chartColors, seriesOrder, tooltipStyle } from '../lib/chartTheme';
import type { BodyMeasurement, CardioLog, Session, WeeklySchedule, WeightGoal } from '../types';

const MEASURE_FIELDS: { key: 'chestCm' | 'waistCm' | 'hipCm' | 'armLeftCm' | 'thighLeftCm'; label: string }[] = [
  { key: 'waistCm', label: 'Cintura' },
  { key: 'chestCm', label: 'Peito' },
  { key: 'armLeftCm', label: 'Braço' },
  { key: 'thighLeftCm', label: 'Coxa' },
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

/** Tile compacto de estatística — usado na fileira de resumo no topo da Evolução. */
function StatTile({
  icon,
  label,
  value,
  sub,
  subTone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  subTone?: 'up' | 'down' | 'neutral';
}) {
  const subColor = subTone === 'up' ? 'var(--success)' : subTone === 'down' ? 'var(--danger)' : 'var(--text-faint)';
  return (
    <Card className="!p-3 flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-faint)' }}>
        {icon}
        <p className="text-[11px] font-medium leading-tight">{label}</p>
      </div>
      <p className="text-lg font-semibold leading-none truncate">{value}</p>
      {sub && (
        <p className="text-[11px] mt-1 font-medium" style={{ color: subColor }}>
          {sub}
        </p>
      )}
    </Card>
  );
}

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
  const { user } = useAuth();
  const [profile] = useProfile(user?.id);
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set(['waistCm']));

  const freq = useMemo(() => getWeeklyFrequency(sessions, 10), [sessions]);
  const freqData = freq.map((f) => ({
    week: new Date(f.weekStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    treinos: f.count,
  }));

  const sortedByDate = measurements.slice().sort((a, b) => a.date.localeCompare(b.date));
  const weightEntries = sortedByDate.filter((m) => m.weightKg != null);
  const weightData = weightEntries.map((m) => ({
    date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: m.weightKg,
  }));

  const heightCm = profile?.heightCm ?? null;
  const imcData = heightCm
    ? weightEntries.map((m) => ({
        date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        imc: Math.round(calcImc(m.weightKg!, heightCm) * 10) / 10,
      }))
    : [];
  const healthyRange = heightCm ? healthyWeightRangeKg(heightCm) : null;

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

  // ---------- Resumo do topo ----------
  const streakDays = getCurrentStreakDays(sessions, cardioLogs, weeklySchedule);
  const monthCount = getTotalSessionsThisMonth(sessions);
  const trendCutoff = Date.now() - 28 * 24 * 60 * 60 * 1000;
  const baselineWeightEntry =
    weightEntries.slice().reverse().find((m) => Date.parse(m.date) <= trendCutoff) ?? weightEntries[0];
  const latestWeightEntry = weightEntries[weightEntries.length - 1];
  const weightTrendKg =
    latestWeightEntry && baselineWeightEntry && baselineWeightEntry.id !== latestWeightEntry.id
      ? Math.round((latestWeightEntry.weightKg! - baselineWeightEntry.weightKg!) * 10) / 10
      : null;
  const latestWeight = latestWeightEntry?.weightKg ?? profile?.initialWeightKg ?? undefined;
  const currentImc = heightCm && latestWeight != null ? calcImc(latestWeight, heightCm) : null;
  const currentImcClass = currentImc != null ? classifyImc(currentImc) : null;

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

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <StatTile
          icon={<Flame size={13} />}
          label="Sequência"
          value={`${streakDays} dia${streakDays === 1 ? '' : 's'}`}
        />
        <StatTile icon={<CalendarCheck size={13} />} label="Treinos/mês" value={String(monthCount)} />
        <StatTile
          icon={<Scale size={13} />}
          label="Peso"
          value={latestWeight != null ? `${latestWeight}kg` : '—'}
          sub={
            weightTrendKg != null && weightTrendKg !== 0
              ? `${weightTrendKg > 0 ? '+' : ''}${weightTrendKg}kg em ~28d`
              : undefined
          }
          subTone={weightTrendKg != null ? (weightTrendKg > 0 ? 'down' : 'up') : 'neutral'}
        />
        <StatTile
          icon={<Activity size={13} />}
          label="IMC"
          value={currentImc != null ? currentImc.toFixed(1) : '—'}
          sub={currentImcClass?.label}
        />
      </div>

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
              <AreaChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.categorical.violet} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chartColors.categorical.violet} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartColors.gridline} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
                <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={38} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: chartColors.textSecondary }}
                  formatter={(value) => [`${value}kg`, 'Peso']}
                  cursor={{ stroke: chartColors.gridline }}
                />
                <Area
                  type="monotone"
                  dataKey="peso"
                  stroke={chartColors.categorical.violet}
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="url(#weightFill)"
                  dot={{ r: 3, fill: chartColors.categorical.violet, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {imcData.length > 0 && healthyRange && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Evolução do IMC</p>
            {currentImcClass && (
              <Pill tone="default" style={{ color: currentImcClass.colorVar }}>
                {currentImcClass.label}
              </Pill>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>
            Faixa sombreada = considerada normal pra {heightCm}cm ({healthyRange[0]}–{healthyRange[1]}kg)
          </p>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <AreaChart data={imcData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="imcFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.categorical.aqua} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chartColors.categorical.aqua} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartColors.gridline} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
                <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={38} domain={['auto', 'auto']} />
                <ReferenceArea y1={18.5} y2={24.9} fill={chartColors.status.good} fillOpacity={0.08} strokeOpacity={0} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: chartColors.textSecondary }}
                  formatter={(value) => [value, 'IMC']}
                  cursor={{ stroke: chartColors.gridline }}
                />
                <Area
                  type="monotone"
                  dataKey="imc"
                  stroke={chartColors.categorical.aqua}
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="url(#imcFill)"
                  dot={{ r: 3, fill: chartColors.categorical.aqua, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {!heightCm && (
        <Card className="mb-4">
          <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
            <Activity size={15} style={{ color: 'var(--brand)' }} /> Evolução do IMC
          </p>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Complete sua altura em Conta (toque no seu perfil no topo da Home) pra ver esse gráfico aqui.
          </p>
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
              <AreaChart data={measureData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid stroke={chartColors.gridline} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
                <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={38} domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chartColors.textSecondary }} cursor={{ stroke: chartColors.gridline }} />
                {MEASURE_FIELDS.filter((f) => activeFields.has(f.key)).map((f) => (
                  <Area
                    key={f.key}
                    type="monotone"
                    dataKey={f.key}
                    name={f.label}
                    stroke={seriesOrder[MEASURE_FIELDS.findIndex((x) => x.key === f.key) % seriesOrder.length]}
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    dot={{ r: 3, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
