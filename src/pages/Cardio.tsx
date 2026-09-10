import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, Bike, Footprints, Waves, Trash2, Route as RouteIcon, Clock, Gauge, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { addCardioLog, deleteCardioLog } from '../lib/actions';
import { PageHeader, Card, Button, EmptyState, Pill } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { PhotoField } from '../components/PhotoField';
import { chartColors, tooltipStyle } from '../lib/chartTheme';
import { WEEKDAY_ORDER } from '../types';
import type { CardioActivityType, CardioLog } from '../types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Date.getDay(): 0=domingo...6=sábado → nosso índice seg..dom (0..6) */
function todayWeekdayKey() {
  const jsDay = new Date().getDay();
  return WEEKDAY_ORDER[(jsDay + 6) % 7];
}

/** Formata min/km a partir de duração e distância. */
function formatPace(durationMin: number, distanceKm?: number): string | null {
  if (!distanceKm || distanceKm <= 0) return null;
  const paceMin = durationMin / distanceKm;
  const min = Math.floor(paceMin);
  const sec = Math.round((paceMin - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

const TYPE_META: Record<CardioActivityType, { label: string; icon: typeof Bike; color: string }> = {
  corrida: { label: 'Corrida', icon: Footprints, color: 'var(--brand)' },
  bike: { label: 'Bike', icon: Bike, color: 'var(--success)' },
  natacao: { label: 'Natação', icon: Waves, color: 'var(--warn)' },
};

export function Cardio() {
  const { cardioLogs, weeklySchedule } = useAppData();
  const [sheetOpen, setSheetOpen] = useState(false);

  const todaySchedule = weeklySchedule[todayWeekdayKey()];
  const suggestedDistanceKm = todaySchedule?.kind === 'cardio' ? todaySchedule.suggestedDistanceKm : undefined;

  const [form, setForm] = useState({
    date: todayIso(),
    type: 'corrida' as CardioActivityType,
    durationMin: '',
    distanceKm: '',
    avgHeartRate: '',
    rpe: '',
    notes: '',
  });
  const [proofPhoto, setProofPhoto] = useState<string | undefined>(undefined);

  function openSheet() {
    if (suggestedDistanceKm && form.date === todayIso() && !form.distanceKm) {
      setForm((f) => ({ ...f, distanceKm: String(suggestedDistanceKm) }));
    }
    setSheetOpen(true);
  }

  const sorted = cardioLogs.slice().sort((a, b) => b.date.localeCompare(a.date));

  const runProgress = useMemo(() => {
    return cardioLogs
      .filter((c) => c.type === 'corrida' && c.distanceKm && c.distanceKm > 0)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((c) => ({
        date: new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        distanciaKm: c.distanceKm as number,
        paceMin: Number((c.durationMin / (c.distanceKm as number)).toFixed(2)),
      }));
  }, [cardioLogs]);

  const stats = useMemo(() => {
    const totalKm = cardioLogs.reduce((sum, c) => sum + (c.distanceKm ?? 0), 0);
    const totalMin = cardioLogs.reduce((sum, c) => sum + c.durationMin, 0);
    const avgPaceStr = totalKm > 0 ? formatPace(totalMin, totalKm) : null;
    return { totalKm, totalMin, count: cardioLogs.length, avgPaceStr };
  }, [cardioLogs]);

  function num(v: string): number | undefined {
    const n = Number(v);
    return v.trim() === '' || Number.isNaN(n) ? undefined : n;
  }

  function handleSave() {
    const durationMin = Number(form.durationMin);
    if (!durationMin || durationMin <= 0) return;
    addCardioLog({
      date: form.date,
      type: form.type,
      durationMin,
      distanceKm: num(form.distanceKm),
      avgHeartRate: num(form.avgHeartRate),
      rpe: num(form.rpe),
      notes: form.notes.trim() || undefined,
      proofPhotoDataUrl: proofPhoto,
    });
    setSheetOpen(false);
    setForm({ ...form, durationMin: '', distanceKm: '', avgHeartRate: '', rpe: '', notes: '' });
    setProofPhoto(undefined);
  }

  return (
    <div className="px-4">
      <PageHeader
        title="Cardio"
        right={
          <button
            onClick={openSheet}
            aria-label="Registrar atividade"
            className="p-2 rounded-full"
            style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
          >
            <Plus size={20} />
          </button>
        }
      />

      {suggestedDistanceKm && (
        <Card className="mb-4 flex items-center gap-3" style={{ borderColor: 'var(--success)' }}>
          <RouteIcon size={18} style={{ color: 'var(--success)' }} />
          <p className="text-sm">
            Meta de hoje: <span className="font-semibold">{suggestedDistanceKm} km</span>
          </p>
        </Card>
      )}

      {cardioLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <Card className="flex flex-col items-center py-3 !p-3">
            <RouteIcon size={17} style={{ color: 'var(--brand)' }} />
            <p className="text-lg font-semibold mt-1">{stats.totalKm.toFixed(1)}</p>
            <p className="text-[10px] text-center" style={{ color: 'var(--text-faint)' }}>
              km no total
            </p>
          </Card>
          <Card className="flex flex-col items-center py-3 !p-3">
            <Clock size={17} style={{ color: 'var(--success)' }} />
            <p className="text-lg font-semibold mt-1">{Math.round(stats.totalMin / 60)}h</p>
            <p className="text-[10px] text-center" style={{ color: 'var(--text-faint)' }}>
              {stats.count} atividade{stats.count !== 1 ? 's' : ''}
            </p>
          </Card>
          <Card className="flex flex-col items-center py-3 !p-3">
            <Gauge size={17} style={{ color: 'var(--warn)' }} />
            <p className="text-lg font-semibold mt-1">{stats.avgPaceStr ?? '—'}</p>
            <p className="text-[10px] text-center" style={{ color: 'var(--text-faint)' }}>
              pace médio
            </p>
          </Card>
        </div>
      )}

      {runProgress.length >= 2 && (
        <Card className="mb-5">
          <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <TrendingUp size={15} style={{ color: 'var(--brand)' }} /> Progressão da corrida
          </p>
          <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>
            Distância (km)
          </p>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer>
              <LineChart data={runProgress} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={chartColors.gridline} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartColors.axis, fontSize: 10 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
                <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={30} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: chartColors.textSecondary }}
                  formatter={(value) => [`${value} km`, 'Distância']}
                  cursor={{ stroke: chartColors.gridline }}
                />
                <Line
                  type="monotone"
                  dataKey="distanciaKm"
                  stroke={chartColors.categorical.blue}
                  strokeWidth={2}
                  strokeLinecap="round"
                  dot={{ r: 3, fill: chartColors.categorical.blue, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs mb-1 mt-3" style={{ color: 'var(--text-faint)' }}>
            Pace (min/km) — quanto menor, melhor
          </p>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer>
              <LineChart data={runProgress} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={chartColors.gridline} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartColors.axis, fontSize: 10 }} axisLine={{ stroke: chartColors.gridline }} tickLine={false} />
                <YAxis
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  reversed
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: chartColors.textSecondary }}
                  formatter={(value) => [`${value} min/km`, 'Pace']}
                  cursor={{ stroke: chartColors.gridline }}
                />
                <Line
                  type="monotone"
                  dataKey="paceMin"
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
      )}

      <p className="text-sm font-semibold mb-2.5" style={{ color: 'var(--text-dim)' }}>
        Histórico
      </p>

      {sorted.length === 0 ? (
        <EmptyState
          title="Nenhuma atividade registrada"
          subtitle="Registre sua corrida ou pedalada para acompanhar seu treino híbrido."
          action={
            <Button onClick={openSheet}>
              <span className="flex items-center gap-2">
                <Plus size={16} /> Registrar atividade
              </span>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5 pb-6">
          {sorted.map((c) => (
            <CardioRow key={c.id} log={c} onDelete={() => deleteCardioLog(c.id)} />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Registrar atividade">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {(['corrida', 'bike', 'natacao'] as CardioActivityType[]).map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              const active = form.type === t;
              return (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
                  style={{
                    background: active ? 'var(--brand-dim)' : 'var(--surface-2)',
                    color: active ? 'var(--brand)' : 'var(--text-dim)',
                  }}
                >
                  <Icon size={16} /> {meta.label}
                </button>
              );
            })}
          </div>

          <Field label="Data">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface-2)' }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duração (min)">
              <input
                type="number"
                inputMode="numeric"
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                placeholder="Ex: 40"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface-2)' }}
              />
            </Field>
            <Field label="Distância (km)">
              <input
                type="number"
                inputMode="decimal"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                placeholder="Ex: 5.2"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface-2)' }}
              />
            </Field>
            <Field label="FC média (bpm)">
              <input
                type="number"
                inputMode="numeric"
                value={form.avgHeartRate}
                onChange={(e) => setForm({ ...form, avgHeartRate: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface-2)' }}
              />
            </Field>
            <Field label="RPE (1-10)">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                value={form.rpe}
                onChange={(e) => setForm({ ...form, rpe: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface-2)' }}
              />
            </Field>
          </div>

          {form.durationMin && form.distanceKm && (
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Pace estimado: {formatPace(Number(form.durationMin), Number(form.distanceKm)) ?? '—'}
            </p>
          )}

          <Field label="Notas (opcional)">
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ex: subida forte no final"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface-2)' }}
            />
          </Field>

          <PhotoField value={proofPhoto} onChange={setProofPhoto} label="Foto do relógio/tracker (opcional, prova pro seu foguinho)" />

          <Button full disabled={!form.durationMin} onClick={handleSave} className="mt-1">
            Salvar atividade
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function CardioRow({ log, onDelete }: { log: CardioLog; onDelete: () => void }) {
  const meta = TYPE_META[log.type];
  const Icon = meta.icon;
  const pace = formatPace(log.durationMin, log.distanceKm);

  return (
    <Card className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
        <Icon size={16} style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-faint)' }}>
          {new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone="brand">{meta.label}</Pill>
          <Pill>{log.durationMin} min</Pill>
          {log.distanceKm != null && <Pill>{log.distanceKm} km</Pill>}
          {pace && <Pill>{pace}</Pill>}
          {log.avgHeartRate != null && <Pill>{log.avgHeartRate} bpm</Pill>}
          {log.rpe != null && <Pill>RPE {log.rpe}</Pill>}
        </div>
        {log.notes && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>
            {log.notes}
          </p>
        )}
      </div>
      {log.proofPhotoDataUrl && (
        <img src={log.proofPhotoDataUrl} alt="Prova da atividade" className="w-10 h-10 rounded-lg object-cover shrink-0" />
      )}
      <button onClick={onDelete} style={{ color: 'var(--text-faint)' }} className="shrink-0">
        <Trash2 size={15} />
      </button>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
        {label}
      </span>
      {children}
    </label>
  );
}
