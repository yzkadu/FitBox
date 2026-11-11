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
import { Flame, CalendarCheck, Scale, Activity } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { getWeeklyFrequency, getCurrentStreakDays, getTrainingDaysThisMonth } from '../lib/stats';
import { calcImc, classifyImc, healthyWeightRangeKg } from '../lib/imc';
import { PageHeader, Card, EmptyState, Pill } from '../components/ui';
import { chartColors, seriesOrder, tooltipStyle } from '../lib/chartTheme';
import type { BodyMeasurement } from '../types';


const MEASURE_FIELDS: {
  key: 'chestCm' | 'waistCm' | 'hipCm' | 'armLeftCm' | 'thighLeftCm' | 'calfLeftCm' | 'forearmLeftCm';
  label: string;
}[] = [
  { key: 'waistCm', label: 'Cintura' },
  { key: 'chestCm', label: 'Peito' },
  { key: 'armLeftCm', label: 'Braço' },
  { key: 'thighLeftCm', label: 'Coxa' },
  { key: 'calfLeftCm', label: 'Panturrilha' },
  { key: 'forearmLeftCm', label: 'Antebraço' },
];

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

export function Progress() {
  const { sessions, measurements, cardioLogs, weeklySchedule } = useAppData();
  const { user } = useAuth();
  const [profile] = useProfile(user?.id);
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set(['waistCm']));

  const freq = useMemo(() => getWeeklyFrequency(sessions, cardioLogs, 10), [sessions, cardioLogs]);
  const freqData = freq.map((f) => ({
    week: new Date(f.weekStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    dias: f.count,
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

  const measureData = sortedByDate.map((m) => {
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
  const monthCount = getTrainingDaysThisMonth(sessions, cardioLogs);
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

  const valueStats = (field: keyof BodyMeasurement) => {
    const values = sortedByDate
      .map(entry => ({date:entry.date,value:entry[field]}))
      .filter((item):item is {date:string;value:number} => typeof item.value === 'number' && Number.isFinite(item.value));
    const recent = values.slice(-3);
    const average = recent.length ? recent.reduce((sum,item)=>sum+item.value,0)/recent.length : null;
    const first = values[0]?.value ?? null;
    const last = values[values.length-1]?.value ?? null;
    return {count:values.length,average,first,last,delta:first!==null&&last!==null&&values.length>1?last-first:null};
  };
  const weightStats=valueStats('weightKg');
  const fmt=(value:number,unit:string)=>value.toLocaleString('pt-BR',{maximumFractionDigits:1,minimumFractionDigits:1})+' '+unit;
  const measureStats=MEASURE_FIELDS.map(field=>({...field,stats:valueStats(field.key)}))
    .filter(item=>item.stats.count>0);
  const recentMeasurements=sortedByDate.slice(-6).reverse();

  const hasAnyData = sessions.some((s) => s.finishedAt) || cardioLogs.length > 0 || measurements.length > 0;

  if (!hasAnyData) {
    return (
      <div className="px-4 pb-6">
        <PageHeader title="Evolução" />
        <EmptyState title="Seu histórico começa com uma anotação" subtitle="Registre peso e medidas corporais ou conclua um treino. As médias e tendências aparecem automaticamente conforme você adiciona registros." />
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
        <StatTile icon={<CalendarCheck size={13} />} label="Dias ativos/mês" value={String(monthCount)} />
        <StatTile
          icon={<Scale size={13} />}
          label="Peso"
          value={latestWeight != null ? `${latestWeight}kg` : '—'}
          sub={
            weightTrendKg != null && weightTrendKg !== 0
              ? `${weightTrendKg > 0 ? '+' : ''}${weightTrendKg}kg em ~28d`
              : undefined
          }
          subTone="neutral"
        />
        <StatTile
          icon={<Activity size={13} />}
          label="IMC"
          value={currentImc != null ? currentImc.toFixed(1) : '—'}
          sub={currentImcClass?.label}
        />
      </div>




      <Card className="mb-4">
        <h2 className="text-sm font-semibold">Resumo das anotações</h2>
        <p className="text-xs mt-1 mb-3" style={{color:'var(--text-dim)'}}>Médias dos últimos 3 registros de cada medida (não são metas). Evoluem à medida que você anota.</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg p-3" style={{background:'var(--surface-2)'}}>
            <p className="text-xs" style={{color:'var(--text-dim)'}}>Peso · média recente</p>
            <p className="text-lg font-semibold">{weightStats.average===null?'—':fmt(weightStats.average,'kg')}</p>
            <p className="text-xs" style={{color:'var(--text-faint)'}}>{weightStats.count} registro(s)</p>
          </div>
          <div className="rounded-lg p-3" style={{background:'var(--surface-2)'}}>
            <p className="text-xs" style={{color:'var(--text-dim)'}}>Peso · primeira → última anotação</p>
            <p className="text-lg font-semibold">{weightStats.delta===null?'—':(weightStats.delta>0?'+':'')+fmt(weightStats.delta,'kg')}</p>
            <p className="text-xs" style={{color:'var(--text-faint)'}}>Variação observada, sem julgamento de meta</p>
          </div>
        </div>
        {measureStats.length>0 && <div className="grid grid-cols-2 gap-2">
          {measureStats.map(({key,label,stats})=>(
            <div key={key} className="rounded-lg p-2.5" style={{background:'var(--surface-2)'}}>
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-sm mt-1">{stats.average===null?'—':fmt(stats.average,'cm')} <span className="text-[10px]" style={{color:'var(--text-faint)'}}>média de até 3</span></p>
              <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>{stats.delta===null?'Aguardando mais anotações':(stats.delta>0?'+':'')+fmt(stats.delta,'cm')+' desde a primeira'}</p>
            </div>
          ))}
        </div>}
      </Card>
      <Card className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Últimas anotações corporais</h2>
        <p className="text-xs mb-3" style={{color:'var(--text-dim)'}}>Diário de medidas: cada anotação continua preservada no histórico.</p>
        <div className="flex flex-col gap-2">
          {recentMeasurements.map(entry=>(
            <div key={entry.id} className="rounded-lg p-2.5" style={{background:'var(--surface-2)'}}>
              <p className="text-xs font-semibold">{new Date(entry.date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
              <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
                {([['weightKg','kg','Peso'],...MEASURE_FIELDS.map(f=>[f.key,'cm',f.label])] as [keyof BodyMeasurement,string,string][])
                  .filter(([key])=>typeof entry[key]==='number')
                  .map(([key,unit,label])=>label+': '+fmt(entry[key] as number,unit)).join(' · ')}
              </p>
              {entry.notes && <p className="text-xs mt-1">{entry.notes}</p>}
            </div>
          ))}
        </div>
      </Card>
      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Frequência de treino (10 semanas) · dias ativos</p>
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
                formatter={(value) => [value, 'Dias ativos']}
              />
              <Bar dataKey="dias" fill={chartColors.categorical.blue} radius={[4, 4, 0, 0]} maxBarSize={22} />
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
