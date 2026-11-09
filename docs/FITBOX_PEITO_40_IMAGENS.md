# FitBox — novo guia de execução de peito (40 ilustrações)

O usuário enviou **8 páginas com 5 exercícios cada** em 09/11/2026. Foram recortadas **40 ilustrações** com nomes exatos do catálogo; nenhum exercício novo é necessário e os IDs não devem mudar.

O pacote desta conversa é **`fitbox_peito_40_exercicios_v3.zip`**. Contém:
- `ilustracoes/`: imagens quadradas/retangulares normalizadas em 680 × 500 px, sem título impresso (para o app).
- `cards/`: recortes completos com as faixas azuis de título (para conferência).
- `manifest.json` e `mapeamento.csv`: nome, ID, página e número do quadro de cada exercício.

## Importação e ativação

1. Baixe e descompacte o ZIP fornecido no chat.
2. Na raiz do FitBox, execute:
   ```bash
   node scripts/import-chest-illustrations.mjs /caminho/para/ilustracoes
   npm run build
   npm test
   ```
3. Inclua os 40 arquivos `.webp` de `src/assets/exercise-guide/chest/` no commit desta branch.
4. A função `getChestIllustration()` reconhece automaticamente cada arquivo presente no build. **Quando ainda não há arquivo, a interface preserva a fotografia anterior ou o placeholder**, evitando links quebrados.
5. Confira as páginas de detalhes, programas e sessão: cada exercício deve mostrar **Ilustração do exercício**, não a etiqueta **Foto real**.
6. Só integrar o PR após conferir as 40 imagens no deploy prévio e revisar a adequação da execução representada.

## Correspondências

| Página | Quadro | Nome | ID |
|---:|---:|---|---|
| 1 | 1 | Supino reto com barra | \`ex-supino-reto-barra\` |
| 1 | 2 | Supino reto com halteres | \`ex-supino-reto-halter\` |
| 1 | 3 | Supino inclinado com halteres | \`ex-supino-inclinado-halter\` |
| 1 | 4 | Supino inclinado com barra | \`ex-supino-inclinado-barra\` |
| 1 | 5 | Supino declinado com barra | \`ex-supino-declinado-barra\` |
| 2 | 1 | Supino máquina | \`ex-supino-maquina\` |
| 2 | 2 | Supino inclinado máquina | \`ex-supino-inclinado-maquina\` |
| 2 | 3 | Crucifixo com halteres | \`ex-crucifixo-halter\` |
| 2 | 4 | Crossover (polia dupla) | \`ex-crossover\` |
| 2 | 5 | Voador / Peck deck | \`ex-voador-peck-deck\` |
| 3 | 1 | Flexão de braço | \`ex-flexao\` |
| 3 | 2 | Pullover com halter | \`ex-pullover-halter\` |
| 3 | 3 | Supino declinado com halteres | \`ex-fedb-decline-dumbbell-bench-press\` |
| 3 | 4 | Crucifixo declinado com halteres | \`ex-fedb-decline-dumbbell-flyes\` |
| 3 | 5 | Crucifixo inclinado com halteres | \`ex-fedb-incline-dumbbell-flyes\` |
| 4 | 1 | Crucifixo inclinado no cabo | \`ex-fedb-incline-cable-flye\` |
| 4 | 2 | Crucifixo reto no cabo | \`ex-fedb-flat-bench-cable-flyes\` |
| 4 | 3 | Supino unilateral com halter | \`ex-fedb-one-arm-dumbbell-bench-press\` |
| 4 | 4 | Supino reto pegada aberta com barra | \`ex-fedb-wide-grip-barbell-bench-press\` |
| 4 | 5 | Svend press (compressão de anilha) | \`ex-fedb-svend-press\` |
| 5 | 1 | Supino reto no Smith | \`ex-fedb-smith-machine-bench-press\` |
| 5 | 2 | Supino inclinado no Smith | \`ex-fedb-smith-machine-incline-bench-press\` |
| 5 | 3 | Supino declinado no Smith | \`ex-fedb-smith-machine-decline-press\` |
| 5 | 4 | Supino com halteres (pegada neutra) | \`ex-fedb-dumbbell-bench-press-with-neutral-grip\` |
| 5 | 5 | Supino no cabo | \`ex-fedb-cable-chest-press\` |
| 6 | 1 | Flexão com pés elevados | \`ex-fedb-push-ups-with-feet-elevated\` |
| 6 | 2 | Supino inclinado pegada neutra com halteres | \`ex-fedb-incline-dumbbell-bench-with-palms-facing-in\` |
| 6 | 3 | Flexão aberta | \`ex-fedb-push-up-wide\` |
| 6 | 4 | Supino na máquina articulada (leverage) | \`ex-fedb-leverage-chest-press\` |
| 6 | 5 | Flexão declinada | \`ex-fedb-decline-push-up\` |
| 7 | 1 | Supino com pegada fechada | \`ex-new-supinocompegadafechada\` |
| 7 | 2 | Flexão com mãos elevadas | \`ex-new-flexaocommaoselevadas\` |
| 7 | 3 | Flexão arqueiro | \`ex-new-flexaoarqueiro\` |
| 7 | 4 | Crucifixo unilateral no cabo | \`ex-new-crucifixounilateralnocabo\` |
| 7 | 5 | Crossover alto para baixo | \`ex-new-crossoveraltoparabaixo\` |
| 8 | 1 | Press de peito na polia em pé | \`ex-new-pressdepeitonapoliaempe\` |
| 8 | 2 | Flexão com toque no ombro | \`ex-new-flexaocomtoquenoombro\` |
| 8 | 3 | Supino com kettlebell | \`ex-new-supinocomkettlebell\` |
| 8 | 4 | Flexão no TRX | \`ex-new-flexaonotrx\` |
| 8 | 5 | Flexão com resistência elástica | \`ex-new-flexaocomresistenciaelastica\` |

## Revisão técnica

As artes representam uma posição demonstrativa, não uma animação. Alguns nomes e variantes exigem atenção: `Flexão declinada` e `Flexão com pés elevados` podem ser duplicações semânticas; `Crucifixo reto/inclinado no cabo` depende do banco e configuração real. Não excluir registros nem juntar exercícios sem avaliação das fichas e histórico.
