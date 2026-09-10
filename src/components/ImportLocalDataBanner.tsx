import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card, Button } from './ui';
import { findLocalBackups, importBackupToAccount, type LocalBackup } from '../lib/importLocal';
import { store } from '../lib/storage';

export function ImportLocalDataBanner({ userId }: { userId: string }) {
  const [backups] = useState<LocalBackup[]>(() => findLocalBackups());
  const [importingId, setImportingId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (dismissed || backups.length === 0) return null;

  async function handleImport(backup: LocalBackup) {
    setImportingId(backup.profileId);
    setErrorMsg(null);
    try {
      await importBackupToAccount(userId, backup.data);
      await store.loadForUser(userId);
      setDismissed(true);
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
      <div className="flex flex-col gap-2">
        {backups.map((b) => (
          <div key={b.profileId} className="flex items-center justify-between gap-2">
            <span className="text-sm truncate">
              {b.profile.emoji ?? '💪'} {b.profile.name}
            </span>
            <Button
              className="!px-3 !py-1.5 !text-xs shrink-0"
              onClick={() => handleImport(b)}
              disabled={importingId !== null}
            >
              {importingId === b.profileId ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        ))}
      </div>
      {errorMsg && (
        <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>
          {errorMsg}
        </p>
      )}
      <button onClick={() => setDismissed(true)} className="text-xs mt-3" style={{ color: 'var(--text-faint)' }}>
        Ignorar
      </button>
    </Card>
  );
}
