import { useState, type FormEvent, type ReactNode } from 'react';
import { CalendarDays, Clock3, Flame, HeartPulse, Plus, Trash2 } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { addActivityLog, deleteActivityLog } from '../lib/actions';
import { localIsoDate } from '../lib/nextTraining';
import type { ActivityKind, ActivityLog } from '../types';
import { Button, Card, EmptyState, PageHeader, Pill } from '../components/ui';
import { Sheet } from '../components/Sheet';

const OPTIONS: {kind:ActivityKind;label:string}[] = [
  {kind:'hyrox',label:'HYROX'}, {kind:'funcional',label:'Funcional'},
  {kind:'caminhada',label:'Caminhada'}, {kind:'musculacao',label:'Musculação livre'},
  {kind:'cardio',label:'Cardio livre'}, {kind:'esporte',label:'Esporte'},
  {kind:'mobilidade',label:'Mobilidade'}, {kind:'outro',label:'Outro'},
];
const today=()=>localIsoDate(new Date());
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return localIsoDate(d)};
const init=()=>({kind:'hyrox' as ActivityKind,date:today(),label:'',durationMin:'',caloriesKcal:'',avgHeartRate:'',rpe:'',notes:''});
const parseOptional=(value:string)=>value.trim()===''?undefined:Number(value.replace(',','.'));
const displayDate=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
const labelOf=(log:ActivityLog)=>log.kind==='outro' && log.label
  ? log.label : OPTIONS.find(o=>o.kind===log.kind)?.label ?? 'Atividade';
const inputStyle={background:'var(--surface-2)',color:'var(--text)'};
function Field({label,children}:{label:string;children:ReactNode}) {
  return <label className="flex flex-col gap-1.5 text-xs font-medium" style={{color:'var(--text-dim)'}}>
    {label}{children}
  </label>;
}
export function Activities() {
  const {activityLogs}=useAppData();
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState(init);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [confirmDelete,setConfirmDelete]=useState<string|null>(null);
  const [removing,setRemoving]=useState(false);
  function openForm(date=today()){
    setForm({...init(),date});setError('');setNotice('');setOpen(true);
  }
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(saving)return;
    const durationMin=parseOptional(form.durationMin);
    const caloriesKcal=parseOptional(form.caloriesKcal);
    const avgHeartRate=parseOptional(form.avgHeartRate);
    const rpe=parseOptional(form.rpe);
    const parsedDate=new Date(form.date+'T12:00:00');
    if(!form.date||Number.isNaN(parsedDate.getTime())||localIsoDate(parsedDate)!==form.date||form.date>today()){
      setError('Escolha uma data válida até hoje.');return;
    }
    if(durationMin===undefined||!Number.isFinite(durationMin)||durationMin<1||durationMin>1440){
      setError('Informe entre 1 e 1440 minutos.');return;
    }
    if(caloriesKcal!==undefined&&(!Number.isInteger(caloriesKcal)||caloriesKcal<0||caloriesKcal>20000)){
      setError('As calorias devem ser um número inteiro entre 0 e 20000.');return;
    }
    if(avgHeartRate!==undefined&&(!Number.isInteger(avgHeartRate)||avgHeartRate<30||avgHeartRate>250)){
      setError('A frequência média deve estar entre 30 e 250 bpm.');return;
    }
    if(rpe!==undefined&&(!Number.isFinite(rpe)||rpe<1||rpe>10)){
      setError('O esforço deve estar entre 1 e 10.');return;
    }
    if(form.kind==='outro'&&!form.label.trim()){setError('Informe o nome da atividade.');return;}
    setError('');setSaving(true);
    const result=await addActivityLog({
      date:form.date,kind:form.kind,durationMin,
      label:form.kind==='outro'?form.label.trim().slice(0,80):undefined,
      caloriesKcal,avgHeartRate,rpe,notes:form.notes.trim().slice(0,1000)||undefined,
    });
    setSaving(false);
    if(!result.ok){setError(result.error);return;}
    setNotice('Atividade salva com sucesso. O foguinho e a frequência foram atualizados.');
    setOpen(false);setForm(init());
  }
  async function remove(id:string){
    if(removing)return;
    setRemoving(true);setError('');
    const result=await deleteActivityLog(id);
    setRemoving(false);
    if(result.ok){setConfirmDelete(null);setNotice('Registro excluído.');}
    else setError(result.error);
  }
  const ordered=[...activityLogs].sort((a,b)=>b.date.localeCompare(a.date));
  const totalMinutes=activityLogs.reduce((sum,a)=>sum+a.durationMin,0);
  return <div className="px-4 pb-8">
    <PageHeader title="Atividades" right={<button type="button" onClick={()=>openForm()}
      className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2"
      style={{background:'var(--brand-dim)',color:'var(--brand)'}}><Plus size={16}/> Registrar</button>}/>
    <Card className="mb-4">
      <p className="text-sm font-semibold">Fez HYROX ou outra atividade?</p>
      <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
        Registre tipo, duração e calorias, sem montar ficha ou cadastrar exercícios.
      </p>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button onClick={()=>openForm()}>Registrar hoje</Button>
        <Button variant="secondary" onClick={()=>openForm(yesterday())}>Registrar ontem</Button>
      </div>
      <p className="text-[11px] mt-3" style={{color:'var(--text-faint)'}}>
        Dia com atividade concluída conta uma vez no foguinho, mesmo com cardio e musculação juntos.
      </p>
    </Card>
    {notice&&<p role="status" className="text-xs mb-3" style={{color:'var(--success)'}}>{notice}</p>}
    {error&&!open&&<p role="alert" className="text-xs mb-3" style={{color:'var(--danger)'}}>{error}</p>}
    <div className="grid grid-cols-2 gap-2 mb-5">
      <Card className="!p-3"><p className="text-xs" style={{color:'var(--text-dim)'}}>Registros rápidos</p>
        <p className="font-semibold text-xl mt-1">{activityLogs.length}</p></Card>
      <Card className="!p-3"><p className="text-xs" style={{color:'var(--text-dim)'}}>Minutos registrados</p>
        <p className="font-semibold text-xl mt-1">{Math.round(totalMinutes)}</p></Card>
    </div>
    <h2 className="text-sm font-semibold mb-2">Histórico de atividades rápidas</h2>
    {ordered.length===0?<EmptyState title="Ainda não há atividades rápidas"
      subtitle="Registre seu HYROX, funcional ou outro movimento realizado."/>:
      <div className="flex flex-col gap-2">
        {ordered.map(log=><Card key={log.id} className="!p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{labelOf(log)}</p>
              <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
                <CalendarDays size={12} className="inline mr-1"/>{displayDate(log.date)}
              </p>
            </div>
            <button type="button" onClick={()=>setConfirmDelete(log.id)}
              aria-label={'Excluir '+labelOf(log)} className="p-1.5"
              style={{color:'var(--text-faint)'}}><Trash2 size={16}/></button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Pill><Clock3 size={12} className="inline mr-1"/>{log.durationMin} min</Pill>
            {log.caloriesKcal!=null&&<Pill><Flame size={12} className="inline mr-1"/>{log.caloriesKcal} kcal</Pill>}
            {log.avgHeartRate!=null&&<Pill><HeartPulse size={12} className="inline mr-1"/>{log.avgHeartRate} bpm</Pill>}
            {log.rpe!=null&&<Pill>RPE {log.rpe}/10</Pill>}
          </div>
          {log.notes&&<p className="text-xs mt-2" style={{color:'var(--text-dim)'}}>{log.notes}</p>}
          {confirmDelete===log.id&&<div className="flex items-center gap-2 mt-3 pt-2 border-t" style={{borderColor:'var(--border)'}}>
            <span className="text-xs flex-1">Excluir registro?</span>
            <button type="button" disabled={removing} onClick={()=>setConfirmDelete(null)}
              className="text-xs p-2">Cancelar</button>
            <button type="button" disabled={removing} onClick={()=>remove(log.id)}
              className="text-xs p-2 rounded-lg text-white" style={{background:'var(--danger)'}}>
              {removing?'Excluindo...':'Excluir'}</button>
          </div>}
        </Card>)}
      </div>}
    <Sheet open={open} onClose={()=>{if(!saving)setOpen(false)}} title="Registrar atividade">
      <form onSubmit={save} className="flex flex-col gap-4 pb-4">
        <p className="text-xs" style={{color:'var(--text-dim)'}}>
          Informe o que realizou. Kcal são opcionais e devem vir do seu relógio ou da sua estimativa.
        </p>
        <div>
          <p className="text-xs font-semibold mb-2">Tipo de atividade</p>
          <div className="grid grid-cols-2 gap-2">
            {OPTIONS.map(({kind,label})=><button type="button" key={kind} aria-pressed={form.kind===kind}
              onClick={()=>setForm(v=>({...v,kind}))}
              className="rounded-xl px-3 py-2.5 text-xs font-medium"
              style={{background:form.kind===kind?'var(--brand-dim)':'var(--surface-2)',
                color:form.kind===kind?'var(--brand)':'var(--text-dim)'}}>{label}</button>)}
          </div>
        </div>
        {form.kind==='outro'&&<Field label="Nome da atividade">
          <input required maxLength={80} value={form.label} onChange={e=>setForm(v=>({...v,label:e.target.value}))}
            className="rounded-lg px-3 py-2.5 text-sm" style={inputStyle} placeholder="Ex: dança, trilha, futebol"/></Field>}
        <Field label="Data">
          <input type="date" required max={today()} value={form.date}
            onChange={e=>setForm(v=>({...v,date:e.target.value}))}
            className="rounded-lg px-3 py-2.5 text-sm" style={inputStyle}/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duração (min) *">
            <input type="number" required min={1} max={1440} step="any" inputMode="decimal"
              className="rounded-lg px-3 py-2.5 text-sm w-full" style={inputStyle} placeholder="Ex: 60"
              value={form.durationMin} onChange={e=>setForm(v=>({...v,durationMin:e.target.value}))}/></Field>
          <Field label="Calorias gastas (kcal)">
            <input type="number" min={0} max={20000} step={1} inputMode="numeric"
              className="rounded-lg px-3 py-2.5 text-sm w-full" style={inputStyle} placeholder="Opcional"
              value={form.caloriesKcal} onChange={e=>setForm(v=>({...v,caloriesKcal:e.target.value}))}/></Field>
          <Field label="FC média (bpm)">
            <input type="number" min={30} max={250} step={1} inputMode="numeric"
              className="rounded-lg px-3 py-2.5 text-sm w-full" style={inputStyle} placeholder="Opcional"
              value={form.avgHeartRate} onChange={e=>setForm(v=>({...v,avgHeartRate:e.target.value}))}/></Field>
          <Field label="Esforço (RPE 1–10)">
            <input type="number" min={1} max={10} step={1} inputMode="numeric"
              className="rounded-lg px-3 py-2.5 text-sm w-full" style={inputStyle} placeholder="Opcional"
              value={form.rpe} onChange={e=>setForm(v=>({...v,rpe:e.target.value}))}/></Field>
        </div>
        <Field label="Observações (opcional)">
          <textarea rows={3} maxLength={1000} value={form.notes}
            onChange={e=>setForm(v=>({...v,notes:e.target.value}))}
            className="rounded-lg px-3 py-2.5 text-sm" style={inputStyle}
            placeholder="Ex: aula em turma, circuito intenso..."/>
        </Field>
        {error&&<p role="alert" className="text-xs" style={{color:'var(--danger)'}}>{error}</p>}
        <Button type="submit" full disabled={saving||!form.durationMin}>
          {saving?'Salvando...':'Salvar atividade'}
        </Button>
      </form>
    </Sheet>
  </div>;
}
