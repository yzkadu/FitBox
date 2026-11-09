import { useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudUpload, RefreshCcw } from 'lucide-react';
import { retryFailedSync, useSyncStatus } from '../lib/syncStatus';

/** Não esconder uma falha de persistência no console do navegador. */
export function SyncNotice() {
  const { pending, failed, lastError } = useSyncStatus();
  const [retrying, setRetrying] = useState(false);
  if (pending === 0 && failed === 0) return null;
  const hasFailure = failed > 0;
  async function retry() {
    setRetrying(true);
    try { await retryFailedSync(); }
    finally { setRetrying(false); }
  }
  return (
    <div role={hasFailure ? 'alert' : 'status'}
      className="fixed left-3 right-3 bottom-24 lg:bottom-4 lg:left-auto lg:right-5 z-50 rounded-xl shadow-lg px-3 py-2.5 text-xs max-w-md mx-auto lg:mx-0 flex items-center gap-2"
      style={{background:'var(--surface)',border:'1px solid '+(hasFailure?'var(--danger)':'var(--border)'),color:'var(--text)'}}>
      {hasFailure ? <AlertTriangle size={17} className="shrink-0" style={{color:'var(--danger)'}}/> :
        <CloudUpload size={17} className="shrink-0" style={{color:'var(--brand)'}}/>}
      <span className="flex-1">
        {hasFailure ? (lastError ?? 'Algumas alterações não foram sincronizadas.') : 'Salvando alterações no servidor...'}
        {hasFailure && <span className="block mt-0.5 opacity-70">Não feche o app antes de tentar novamente.</span>}
      </span>
      {hasFailure && (
        <button type="button" onClick={retry} disabled={retrying}
          className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-2 font-semibold disabled:opacity-50"
          style={{background:'var(--brand-dim)',color:'var(--brand)'}}>
          {retrying ? <CheckCircle2 size={14}/> : <RefreshCcw size={14}/>}
          {retrying?'Tentando':'Reenviar'}
        </button>
      )}
    </div>
  );
}
