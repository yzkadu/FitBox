// Aviso sonoro de "descanso acabou" pro timer de descanso — gerado na hora
// com a Web Audio API (sem precisar embutir nenhum arquivo de áudio). O
// AudioContext é criado só na primeira vez que alguém interage com a tela
// (dentro de um gesto do usuário, como tocar o botão de concluir a série),
// porque navegadores mobile bloqueiam áudio criado fora de um gesto.

let ctx: AudioContext | null = null;

/** Garante que o AudioContext existe e está "destravado" — chamar isso dentro
 * de um gesto do usuário (ex: onClick) prepara o áudio pra tocar mais tarde,
 * quando o timer chegar a zero sem nenhuma interação nova. */
export function primeRestBeep() {
  try {
    if (!ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  } catch {
    // Web Audio indisponível — segue sem som, o aviso visual continua funcionando.
  }
}

export function playRestBeep() {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Dois "bips" curtos, bem simples.
    [0, 0.18].forEach((offset) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
      osc.connect(gain);
      gain.connect(ctx!.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  } catch {
    // Segue sem som.
  }
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    // Vibration API indisponível (ex: iOS Safari) — segue sem vibrar.
  }
}
