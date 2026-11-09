import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, ArrowLeft, ChevronLeft, ChevronRight, Check, Pencil, Plus, Scale, Trash2, Target } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { saveNutritionGoal, addNutritionEntry, deleteNutritionEntry } from '../lib/actions';
import { PageHeader, Card, Button } from '../components/ui';
import type { NutritionGoal, NutritionEntry } from '../types';

function todayLocal() {
  const d = new Date();
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function dateShift(iso:string,delta:number) {
  const d=new Date(iso+'T12:00:00');
  if (Number.isNaN(d.getTime())) return todayLocal();
  d.setDate(d.getDate()+delta);
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function prettyDate(iso:string) {
  return new Date(iso+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
}
type MacroKey = 'caloriesKcal'|'proteinG'|'carbsG'|'fatG';
const MACROS: {key:MacroKey;label:string;unit:string}[] = [
  {key:'caloriesKcal',label:'Calorias',unit:'kcal'},
  {key:'proteinG',label:'Proteínas',unit:'g'},
  {key:'carbsG',label:'Carboidratos',unit:'g'},
  {key:'fatG',label:'Gorduras',unit:'g'},
];
const fmt=(v:number)=>Number(v.toFixed(1)).toLocaleString('pt-BR',{maximumFractionDigits:1});
const toNumber=(s:string)=>Number(s.replace(',','.'));
const validAmount=(v:number,max=1500)=>Number.isFinite(v)&&v>=0&&v<=max;
function MetricProgress({label,consumed,target,unit}:{label:string;consumed:number;target:number|null;unit:string}) {
  const hasTarget=target!=null && target>0;
  const pct=hasTarget?Math.round(consumed/target*100):0;
  return (
    <div className="rounded-xl p-3" style={{background:'var(--surface-2)'}}>
      <div className="flex items-end justify-between gap-2 mb-2">
        <div>
          <p className="text-xs" style={{color:'var(--text-faint)'}}>{label}</p>
          <p className="font-semibold text-lg tabular-nums mt-1">
            {fmt(consumed)} <span className="text-xs font-normal" style={{color:'var(--text-dim)'}}>{unit}</span>
          </p>
        </div>
        <span className="text-xs text-right" style={{color:'var(--text-dim)'}}>
          {hasTarget ? 'Meta: '+fmt(target)+' '+unit : 'Meta não definida'}
        </span>
      </div>
      <div className="rounded-full h-2 overflow-hidden" style={{background:'var(--surface-3)'}}>
        <div className="rounded-full h-full" style={{width:Math.min(100,pct)+'%',background:'var(--brand)'}}/>
      </div>
      {hasTarget && <p className="text-[11px] mt-1.5" style={{color:'var(--text-faint)'}}>
        {pct}% da meta diária registrada
      </p>}
    </div>
  );
}

export function Nutrition() {
  const navigate=useNavigate();
  const {nutritionGoal,nutritionEntries,weightGoal}=useAppData();
  const [date,setDate]=useState(todayLocal);
  const [editingTarget,setEditingTarget]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const inferred: NutritionGoal['goalKind'] = weightGoal
    ? weightGoal.targetLossKg >= 0 ? 'emagrecer' : 'ganhar_massa'
    : 'manter';
  const [goalForm,setGoalForm]=useState({
    goalKind: nutritionGoal?.goalKind??inferred,
    caloriesKcal:nutritionGoal?.caloriesKcal!=null?String(nutritionGoal.caloriesKcal):'',
    proteinG:nutritionGoal?.proteinG?String(nutritionGoal.proteinG):'',
    carbsG:nutritionGoal?.carbsG?String(nutritionGoal.carbsG):'',
    fatG:nutritionGoal?.fatG?String(nutritionGoal.fatG):'',
  });
  const [label,setLabel]=useState('');
  const [protein,setProtein]=useState('');
  const [carbs,setCarbs]=useState('');
  const [fat,setFat]=useState('');
  const [calories,setCalories]=useState('');
  const [explicitCalories,setExplicitCalories]=useState(false);

  const entries=useMemo(()=>nutritionEntries.filter(e=>e.date===date),[nutritionEntries,date]);
  const totals=useMemo(()=>entries.reduce((acc,e)=>({
    caloriesKcal:acc.caloriesKcal+e.caloriesKcal,
    proteinG:acc.proteinG+e.proteinG,
    carbsG:acc.carbsG+e.carbsG,
    fatG:acc.fatG+e.fatG,
  }),{caloriesKcal:0,proteinG:0,carbsG:0,fatG:0}),[entries]);

  const estimate=4*(toNumber(protein)||0)+4*(toNumber(carbs)||0)+9*(toNumber(fat)||0);
  const caloriesUsed=explicitCalories?toNumber(calories):Math.round(estimate);
  const validEntry=label.trim().length>=1 && label.trim().length<=120 &&
    validAmount(toNumber(protein||'0'))&&validAmount(toNumber(carbs||'0'))&&
    validAmount(toNumber(fat||'0'))&&validAmount(caloriesUsed,15000);

  async function submitGoal() {
    const p=toNumber(goalForm.proteinG||'0'),c=toNumber(goalForm.carbsG||'0'),
      f=toNumber(goalForm.fatG||'0');
    const cal=goalForm.caloriesKcal.trim()?toNumber(goalForm.caloriesKcal):null;
    if (![p,c,f].every(v=>validAmount(v))||(cal!==null&&!validAmount(cal,15000))) {
      setError('Confira as metas de calorias e macronutrientes.');return;
    }
    setSaving(true);setError('');setNotice('');
    try {
      const result=await saveNutritionGoal({goalKind:goalForm.goalKind,caloriesKcal:cal,
        proteinG:p,carbsG:c,fatG:f});
      if (!result.ok) setError(result.error);
      else {setEditingTarget(false);setNotice('Metas atualizadas. Seus registros anteriores foram mantidos.');}
    } catch {setError('Não foi possível salvar. Verifique a conexão.');}
    finally {setSaving(false);}
  }
  async function submitEntry() {
    if (!validEntry) {setError('Informe um nome e valores válidos. Use zero quando não souber a quantidade.');return;}
    setError('');setNotice('');setSaving(true);
    try {
      const result=await addNutritionEntry({
        date,label:label.trim(),caloriesKcal:caloriesUsed,
        proteinG:toNumber(protein||'0'),carbsG:toNumber(carbs||'0'),
        fatG:toNumber(fat||'0'),
      });
      if (!result.ok) setError(result.error);
      else {
        setLabel('');setProtein('');setCarbs('');setFat('');setCalories('');
        setExplicitCalories(false);setNotice('Refeição registrada com sucesso.');
      }
    } catch {setError('Não foi possível registrar. Verifique a conexão.');}
    finally {setSaving(false);}
  }
  async function removeEntry(entry: NutritionEntry) {
    if (!window.confirm('Excluir o registro "'+entry.label+'"?')) return;
    setSaving(true);setError('');setNotice('');
    try {
      const result=await deleteNutritionEntry(entry.id);
      if (!result.ok)setError(result.error);else setNotice('Registro excluído.');
    } catch {setError('Falha ao excluir registro.');}
    finally {setSaving(false);}
  }
  const goalDirection=nutritionGoal?.goalKind=== 'emagrecer'?'Emagrecimento':
    nutritionGoal?.goalKind==='ganhar_massa'?'Ganho de massa':'Manutenção';

  return (
    <div className="px-4 lg:px-0 pb-10">
      <button type="button" onClick={()=>navigate('/evolucao')}
        className="inline-flex items-center gap-2 text-xs mt-5 mb-4 lg:mt-0" style={{color:'var(--text-dim)'}}>
        <ArrowLeft size={15}/> Voltar a metas e evolução
      </button>
      <PageHeader title="Nutrição"/>
      <p className="text-sm mb-5" style={{color:'var(--text-dim)'}}>
        Acompanhe o que consumiu em relação às suas próprias metas de proteínas, carboidratos,
        gorduras e calorias. Não é necessário atingir os valores exatamente todos os dias.
      </p>

      <Card className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-semibold flex items-center gap-2"><Target size={17} style={{color:'var(--brand)'}}/> Meu objetivo</p>
            <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
              {nutritionGoal?goalDirection:'Defina metas para acompanhar seus nutrientes'}
            </p>
            {weightGoal && (
              <p className="text-xs mt-1" style={{color:'var(--text-faint)'}}>
                Meta de peso vinculada: {weightGoal.targetLossKg>=0?'perder':'ganhar'} {fmt(Math.abs(weightGoal.targetLossKg))} kg
              </p>
            )}
          </div>
          <button type="button" onClick={()=>{setEditingTarget(v=>!v);setError('');}}
            className="rounded-xl px-3 py-2 text-xs flex items-center gap-1"
            style={{background:'var(--brand-dim)',color:'var(--brand)'}}>
            <Pencil size={14}/> {nutritionGoal?'Editar metas':'Definir metas'}
          </button>
        </div>
        {editingTarget && (
          <div className="rounded-xl p-3 flex flex-col gap-3" style={{background:'var(--surface-2)'}}>
            <label className="text-xs">
              Objetivo alimentar
              <select value={goalForm.goalKind}
                onChange={e=>setGoalForm(f=>({...f,goalKind:e.target.value as NutritionGoal['goalKind']}))}
                className="w-full rounded-xl px-3 py-2.5 mt-1" style={{background:'var(--surface)',color:'var(--text)'}}>
                <option value="emagrecer">Emagrecimento</option>
                <option value="ganhar_massa">Ganho de massa muscular</option>
                <option value="manter">Manutenção</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MACROS.map(m=>(
                <label key={m.key} className="text-xs">
                  {m.label} / dia ({m.unit})
                  <input type="number" min={0} max={m.key==='caloriesKcal'?15000:1500}
                    step={m.key==='caloriesKcal'?1:0.1}
                    value={goalForm[m.key]}
                    onChange={e=>setGoalForm(v=>({...v,[m.key]:e.target.value}))}
                    placeholder="Definir" className="w-full rounded-xl px-3 py-2.5 mt-1"
                    style={{background:'var(--surface)',color:'var(--text)'}}/>
                </label>
              ))}
            </div>
            <p className="text-xs" style={{color:'var(--text-faint)'}}>
              Configure metas próprias ou definidas com nutricionista. Não calculamos automaticamente
              déficits calóricos nem prescrevemos quantidades pela meta de peso.
            </p>
            <div className="flex gap-2">
              <Button full onClick={submitGoal} disabled={saving}>{saving?'Salvando...':'Salvar metas'}</Button>
              <Button full variant="secondary" onClick={()=>setEditingTarget(false)} disabled={saving}>Cancelar</Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <div className="flex gap-2 items-center justify-between mb-4">
          <button type="button" onClick={()=>setDate(v=>dateShift(v,-1))} aria-label="Dia anterior"
            className="rounded-xl p-2" style={{background:'var(--surface-2)'}}><ChevronLeft size={19}/></button>
          <label className="flex-1 text-center">
            <span className="text-sm font-semibold block">{date===todayLocal()?'Hoje':prettyDate(date)}</span>
            <input type="date" value={date} max={todayLocal()} onChange={e=>e.target.value&&setDate(e.target.value)}
              aria-label="Escolher dia de alimentação" className="mt-1 text-xs max-w-full"
              style={{background:'var(--surface)',color:'var(--text-dim)'}}/>
          </label>
          <button type="button" onClick={()=>setDate(v=>dateShift(v,1))}
            disabled={date>=todayLocal()} aria-label="Dia seguinte"
            className="rounded-xl p-2 disabled:opacity-35" style={{background:'var(--surface-2)'}}><ChevronRight size={19}/></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MACROS.map(m=><MetricProgress key={m.key} label={m.label}
            consumed={totals[m.key]} target={nutritionGoal?.[m.key]??null} unit={m.unit}/>)}
        </div>
      </Card>

      <Card className="mb-4">
        <p className="font-semibold flex items-center gap-2 mb-1">
          <Plus size={17} style={{color:'var(--brand)'}}/> Registrar alimento ou refeição
        </p>
        <p className="text-xs mb-4" style={{color:'var(--text-faint)'}}>
          Informe os valores da porção consumida, conforme o rótulo ou uma fonte nutricional confiável.
          Não estimamos automaticamente nutrientes apenas pelo nome.
        </p>
        <label className="text-xs block mb-3">Alimento ou refeição
          <input value={label} onChange={e=>setLabel(e.target.value)} maxLength={120}
            placeholder="Ex.: Almoço, lanche, frango com arroz"
            className="w-full rounded-xl px-3 py-3 text-sm mt-1"
            style={{background:'var(--surface-2)',color:'var(--text)'}}/>
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {([
            ['Proteína (g)',protein,setProtein],
            ['Carbo (g)',carbs,setCarbs],
            ['Gordura (g)',fat,setFat],
          ] as const).map(([name,value,set])=>(
            <label key={name} className="text-xs">{name}
              <input type="number" min={0} max={1500} step={0.1} value={value}
                onChange={e=>set(e.target.value)} placeholder="0"
                className="w-full rounded-xl px-2 py-3 text-sm mt-1"
                style={{background:'var(--surface-2)',color:'var(--text)'}}/>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs mb-3" style={{color:'var(--text-dim)'}}>
          <input type="checkbox" checked={explicitCalories}
            onChange={e=>setExplicitCalories(e.target.checked)}
            className="accent-violet-500"/>
          Informar calorias do rótulo manualmente
        </label>
        {explicitCalories ? (
          <label className="block text-xs mb-3">Calorias da porção (kcal)
            <input type="number" min={0} max={15000} step={1} value={calories}
              onChange={e=>setCalories(e.target.value)} placeholder="0"
              className="w-full rounded-xl px-3 py-2.5 text-sm mt-1"
              style={{background:'var(--surface-2)',color:'var(--text)'}}/>
          </label>
        ) : <p className="text-xs mb-3" style={{color:'var(--text-dim)'}}>
          Estimativa pelos macros: <strong>{fmt(Math.max(0,Math.round(estimate)))} kcal</strong> (4 kcal/g proteína, 4 kcal/g carbo, 9 kcal/g gordura).
        </p>}
        {error && <p className="text-xs mb-3" role="alert" style={{color:'var(--danger)'}}>{error}</p>}
        {notice && <p className="text-xs mb-3" role="status" style={{color:'var(--success)'}}>{notice}</p>}
        <Button full onClick={submitEntry} disabled={saving||!validEntry}>
          <Check size={15} className="inline mr-1"/> {saving?'Salvando...':'Adicionar ao dia'}
        </Button>
      </Card>

      <Card className="mb-4">
        <p className="font-semibold flex items-center gap-2 mb-3">
          <Apple size={17} style={{color:'var(--brand)'}}/> Registros do dia ({entries.length})
        </p>
        {entries.length===0?<p className="text-sm" style={{color:'var(--text-dim)'}}>
          Ainda não há registros nesta data.
        </p>:entries.map(item=>(
          <div key={item.id} className="flex items-center justify-between gap-2 py-3"
            style={{borderBottom:'1px solid var(--border)'}}>
            <div className="min-w-0">
              <p className="text-sm font-medium break-words">{item.label}</p>
              <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
                {fmt(item.caloriesKcal)} kcal · P {fmt(item.proteinG)} g · C {fmt(item.carbsG)} g · G {fmt(item.fatG)} g
              </p>
            </div>
            <button type="button" onClick={()=>removeEntry(item)} disabled={saving}
              aria-label={'Excluir '+item.label} style={{color:'var(--text-faint)'}}
              className="p-2 shrink-0 disabled:opacity-50"><Trash2 size={16}/></button>
          </div>
        ))}
      </Card>

      <button type="button" onClick={()=>navigate('/evolucao')} className="w-full text-left rounded-xl p-3 flex items-center gap-2 text-sm"
        style={{border:'1px solid var(--border)',color:'var(--brand)'}}>
        <Scale size={17}/> Ver meta de peso e evolução de medidas <ChevronRight size={17} className="ml-auto"/>
      </button>
      <p className="text-xs mt-3" style={{color:'var(--text-faint)'}}>
        O registro é informativo, não substitui orientação nutricional. Valores de rótulos e
        estimativas podem diferir da composição real. Não use o app para impor restrições extremas.
      </p>
    </div>
  );
}
