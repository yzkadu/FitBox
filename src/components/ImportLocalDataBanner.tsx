import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card, Button, AppIcon } from './ui';
import { findLocalBackups, importBackupToAccount, exportBackupAsJson, markImported, type LocalBackup } from '../lib/importLocal';
import { store } from '../lib/storage';

const COUNT_LABELS: { key: keyof LocalBackup['counts']; singular: string; plural: string }[] = [
  { key: 'workouts', singular: 'treino', plural: 'treinos' },
  { key: 'sessions', singular: 'sessão', plural: 'sessões' },
  { key: 'measurements', singular: 'medição', plural: 'medições' },
  { key: 'photos', singular: 'foto', plural: 'fotos' },
  { key: 'cardioLogs', singular: 'cardio', plural: 'cardios' },
];

function countsSummary(counts: LocalBackup['counts']): string {
  return COUNT_LABELS.filter((c) => counts[c.key] > 0)
    .map((c) => `${counts[c.key]} ${counts[c.key] === 1 ? c.singular : c.plural}`)
    .join(' · ');
}

export function ImportLocalDataBanner({ userId }: { userId: string }) {
  const [backups, setBackups] = useState<LocalBackup[]>(() => findLocalBackups());
  const [importingId, setImportingId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (dismissed || backups.length === 0) return null;

  async function handleImport(backup: LocalBackup) {
    setImportingId(backup.profileId);
    setErrorMsg(null);
    try {
      await importBackupToAccount(userId, backup.data);
      // Só marca como importado (e para de aparecer de novo) depois de confirmar
      // sucesso — se der erro, o backup local continua intacto e ainda listado,
      // pra dar pra tentar de novo sem perder nada.
      markImported(backup.profileId);
      await store.loadForUser(userId);
      setBackups((prev) => prev.filter((b) => b.profileId !== backup.profileId));
    } catch (e) {
      console.error('Falha ao importar dados locais:', e);
      setErrorMsg('Não foi possível importar agora. Tenta de novo em instantes.');
    } finally {
      setImportingId(null);
    }
  }

  return (
    <Card className="mb-4" style={{ borderColor: 'var(--brand)' }}>
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--brand-dim)' }}>
          <Download size={14} style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <p className="text-sm font-medium">Dados encontrados neste navegador</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
            De antes do login existir. Quer importar pra essa conta?
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {backups.map((b) => (
          <div key={b.profileId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm truncate flex items-center gap-1.5">
                <AppIcon value={b.profile.emoji} size={14} /> {b.profile.name}
              </span>
            </div>
            {countsSummary(b.counts) && (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {countsSummary(b.counts)}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                className="!px-3 !py-1.5 !text-xs shrink-0"
                onClick={() => handleImport(b)}
                disabled={importingId !== null}
              >
                {importingId === b.profileId ? 'Importando...' : 'Importar para minha conta'}
              </Button>
              <Button
                variant="secondary"
                className="!px-3 !py-1.5 !text-xs shrink-0"
                onClick={() => exportBackupAsJson(b)}
                disabled={importingId !== null}
              >
                Exportar backup JSON
              </Button>
            </div>
          </div>
        ))}
      </div>
      {errorMsg && (
        <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>
          {errorMsg}
        </p>
      )}
      <button onClick={() => setDismissed(true)} className="text-xs mt-3" style={{ color: 'var(--text-faint)' }}>
        Agora não
      </button>
    </Card>
  );
}
