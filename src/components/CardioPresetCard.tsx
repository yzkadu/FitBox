import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Clock3, Footprints, Pause, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { CardioPreset } from '../lib/cardioPresets';
import { Card, Button } from './ui';

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

export function CardioPresetCard({
  preset, onRegister,
}: {
  preset: CardioPreset;
  onRegister: (preset: CardioPreset) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const elapsedAtStart = useRef(0);
  const startAt = useRef(0);

  const totalSeconds = preset.durationMin * 60;
  const finished = elapsed >= totalSeconds;
  const index = Math.min(
    preset.segments.length - 1,
    Math.floor(Math.min(elapsed, totalSeconds - 1) / (4 * 60)),
  );
  const current = preset.segments[index];
  const progress = Math.min(100, Math.round((elapsed / totalSeconds) * 100));

  useEffect(() => {
    if (!running) return;
    const ticker = window.setInterval(() => {
      const seconds = Math.min(totalSeconds,
        elapsedAtStart.current + Math.floor((Date.now() - startAt.current) / 1000));
      setElapsed(seconds);
      if (seconds >= totalSeconds) setRunning(false);
    }, 350);
    return () => window.clearInterval(ticker);
  }, [running, totalSeconds]);

  function startOrResume() {
    if (finished) return;
    elapsedAtStart.current = elapsed;
    startAt.current = Date.now();
    setStarted(true);
    setRunning(true);
    setExpanded(true);
  }

  function pause() {
    elapsedAtStart.current = Math.min(totalSeconds,
      elapsedAtStart.current + Math.floor((Date.now() - startAt.current) / 1000));
    setElapsed(elapsedAtStart.current);
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setElapsed(0);
    elapsedAtStart.current = 0;
    setStarted(false);
  }

  return (
    <Card className="mb-5">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
          style={{background:'var(--brand-dim)',color:'var(--brand)'}}>
          <Footprints size={20}/>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{preset.title}</p>
          <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>{preset.subtitle}</p>
          <p className="text-xs mt-2" style={{color:'var(--brand)'}}>
            5 etapas de 4 min · Inclinação progressiva · Sem corrida
          </p>
        </div>
      </div>

      <button type="button" onClick={() => setExpanded(x => !x)}
        aria-expanded={expanded} className="flex items-center justify-between w-full mt-3 text-left text-xs font-semibold rounded-lg px-3 py-2"
        style={{background:'var(--surface-2)',color:'var(--brand)'}}>
        {expanded ? 'Ocultar etapas' : 'Ver as cinco etapas'}
        {expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="rounded-xl p-3" style={{background:'var(--surface-2)'}}>
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs font-medium" style={{color:'var(--text-dim)'}}>Cronômetro do protocolo</p>
              <p className="text-xl font-semibold tabular-nums">{clock(elapsed)} <span className="text-xs font-normal" style={{color:'var(--text-faint)'}}>/ 20:00</span></p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{background:'var(--surface-3)'}}>
              <div className="h-full rounded-full" style={{width:progress+'%',background:'var(--brand)',transition:'width .3s linear'}}/>
            </div>
            <p className="text-xs mt-2" style={{color: finished ? 'var(--success)' : 'var(--text-dim)'}}>
              {finished ? 'Tempo previsto concluído. Registre apenas se realizou a atividade.' :
                started ? 'Etapa ' + (index+1) + ': inclinação ' + current.inclineSetting +
                  ' · velocidade ' + current.speedKmh.toLocaleString('pt-BR') + ' km/h' :
                  'O timer é um guia; ajuste as configurações manualmente na esteira.'}
            </p>
            <div className="flex gap-2 mt-3">
              {!running ? (
                <button type="button" onClick={startOrResume} disabled={finished}
                  className="flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{background:'var(--brand)',color:'white'}}>
                  {finished ? <CheckCircle2 size={15}/> : <Play size={15}/>}
                  {finished ? 'Finalizado' : started ? 'Continuar' : 'Iniciar guia'}
                </button>
              ) : (
                <button type="button" onClick={pause}
                  className="flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                  style={{background:'var(--brand)',color:'white'}}>
                  <Pause size={15}/> Pausar
                </button>
              )}
              <button type="button" onClick={reset} className="rounded-xl px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs"
                style={{background:'var(--surface)',color:'var(--text-dim)'}}>
                <RotateCcw size={14}/> Reiniciar
              </button>
            </div>
          </div>

          {preset.segments.map((stage,i) => {
            const active = started && !finished && index === i;
            const passed = started && (elapsed >= stage.endMin*60);
            return (
              <div key={stage.startMin} className="rounded-xl p-3"
                style={{background:active?'var(--brand-dim)':'var(--surface-2)',
                  border:'1px solid '+(active?'var(--brand)':'var(--border-soft)')}}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5"
                    style={{color:active?'var(--brand)':'var(--text)'}}>
                    {passed ? <CheckCircle2 size={14} style={{color:'var(--success)'}}/> : <Clock3 size={14}/>}
                    Minutos {stage.startMin}–{stage.endMin}
                  </p>
                  {active && <span className="text-[10px] font-semibold" style={{color:'var(--brand)'}}>Etapa atual</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-2" style={{background:'var(--surface)'}}>
                    <p className="text-[10px]" style={{color:'var(--text-faint)'}}>Inclinação</p>
                    <p className="text-lg font-semibold tabular-nums">{stage.inclineSetting}</p>
                  </div>
                  <div className="rounded-lg p-2" style={{background:'var(--surface)'}}>
                    <p className="text-[10px]" style={{color:'var(--text-faint)'}}>Velocidade</p>
                    <p className="text-lg font-semibold tabular-nums">{stage.speedKmh.toLocaleString('pt-BR')} <span className="text-xs font-normal">km/h</span></p>
                  </div>
                </div>
                <p className="text-xs mt-2 leading-relaxed" style={{color:'var(--text-dim)'}}>{stage.instruction}</p>
              </div>
            );
          })}
          <p className="text-xs" style={{color:'var(--text-faint)'}}>
            Inclinações 6, 8, 10 e 12 são os valores da referência: confirme se sua
            esteira os expressa em porcentagem ou níveis. A máquina não é controlada pelo app.
            Se estiver começando, reduza a intensidade e faça aquecimento apropriado.
          </p>
        </div>
      )}

      <div className="mt-3">
        <Button full variant="secondary" onClick={() => onRegister(preset)}>
          Registrar este treino realizado
        </Button>
        <p className="text-[11px] mt-2" style={{color:'var(--text-faint)'}}>
          Abrirá o registro com duração e etapas preenchidas. Nada será salvo até você confirmar.
        </p>
      </div>
    </Card>
  );
}
