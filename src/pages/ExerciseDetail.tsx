import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Bot } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { getExerciseHistory, getPersonalRecord, getExerciseTrend } from '../lib/stats';
import { getCoachSuggestion } from '../lib/coach';
import { Card, EmptyState } from '../components/ui';
import { ExerciseGuide } from '../components/ExerciseVisual';
import { getExerciseAnatomicalProfile, getRegionLabel } from '../lib/anatomicalProfiles';
import { chartColors, tooltipStyle } from '../lib/chartTheme';

export function ExerciseDetail() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { sessions, exercises } = useAppData();

  const exercise = exercises.find((e) => e.id === exerciseId);
  const anatomy=getExerciseAnatomicalProfile(exercise);
  const history = getExerciseHistory(sessions, exerciseId ?? '');
  const pr = getPersonalRecord(sessions, exerciseId ?? '');
  const trend = getExerciseTrend(sessions, exerciseId ?? '');
  const coach = getCoachSuggestion(sessions, exerciseId ?? '');
  const coachColor =
    coach.action === 'increase' ? chartColors.status.good : coach.action === 'deload' ? chartColors.status.warning : chartColors.axis;

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

      {exercise && <div className="mb-4"><ExerciseGuide exercise={exercise}/></div>}
      {exercise && <Card className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Anatomia e participação muscular</h2>
        {anatomy ? (
          <div className="flex flex-col gap-2 text-xs">
            <p><strong>Ênfase:</strong> {anatomy.regionTags.map(getRegionLabel).join(' · ') || anatomy.functionalGroup}</p>
            <p><strong>Músculos principais:</strong> {anatomy.primaryMuscles.join('; ') || 'Não identificados'}</p>
            <p><strong>Secundários:</strong> {anatomy.secondaryMuscles.join('; ') || 'Não identificados'}</p>
            <p><strong>Estabilizadores:</strong> {anatomy.stabilizers.join('; ') || 'Não identificados'}</p>
            <p><strong>Padrão:</strong> {anatomy.movementPattern} · <strong>Modalidade:</strong> {anatomy.modality}</p>
            {!anatomy.autoSuggestEnabled && <p style={{color:'var(--warn)'}}>Fora de sugestões automáticas até revisão técnica. Disponível para escolha manual.</p>}
            {anatomy.confidence.startsWith('moderada') && <p style={{color:'var(--warn)'}}>Classificação a revisar: confiança moderada.</p>}
            {anatomy.notes && <p style={{color:'var(--text-dim)'}}>{anatomy.notes}</p>}
            <p style={{color:'var(--text-faint)'}}>Estimativas de ênfase relativa, não isolamento ou percentuais de ativação. Participação secundária não corresponde a uma série completa de hipertrofia. O mapa muscular é separado da demonstração de execução.</p>
          </div>
        ) : (
          <p className="text-xs" style={{color:'var(--text-dim)'}}>Exercício personalizado ou sem revisão anatômica. Mantemos somente o grupo geral; nenhuma porção muscular específica foi inferida.</p>
        )}
      </Card>}

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

          <Card className="mb-4 flex items-start gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'var(--brand-dim)' }}
            >
              <Bot size={14} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-dim)' }}>
                Seu treinador diz
              </p>
              <p className="text-sm" style={{ color: coachColor }}>
                {coach.message}
              </p>
            </div>
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
