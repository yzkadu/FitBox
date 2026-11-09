# Guia ilustrado — Peito

As **40 ilustrações fornecidas pelo usuário** estão instaladas no FitBox através do atlas WebP `public/exercise-guide/chest/sprite.webp` (5 colunas × 8 linhas). Cada exercício tem seu quadro localizado pelo índice fixo em `src/lib/chestIllustrationMedia.ts`.

A tela `ExerciseGuide` usa `spriteIndex` para recortar a ilustração adequada; quando esse mapeamento existir, a imagem do atlas **substitui** as fotografias externas que apareciam anteriormente. Não é necessário reenviar individualmente os 40 arquivos para ativar esta versão.

O material original em alta resolução, incluindo recortes individuais `680 × 500`, permanece no pacote `fitbox_peito_40_exercicios_v3.zip` disponibilizado na conversa. A versão embarcada do atlas é compacta para evitar atrasos no carregamento.

**Revisão técnica:** as imagens são ilustrações demonstrativas geradas para o guia; não substituem avaliação da execução por profissional. Algumas exibem apenas uma posição do movimento.
