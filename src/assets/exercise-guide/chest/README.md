# Guia ilustrado — Peito

Pasta de destino dos **40 arquivos WebP individuais** enviados pelo usuário nas 8 páginas do guia de execução.

**Ainda não estão commitados nesta branch os 40 arquivos binários.** O ZIP gerado nesta conversa contém os recortes:

- Use somente os arquivos da pasta `ilustracoes/` (sem títulos).
- Faça upload dos 40 `.webp` diretamente nesta pasta.
- Preserve os nomes originais baseados nos IDs, por exemplo, `ex-supino-reto-barra.webp`.
- Ao incluir cada arquivo, o Vite passa a carregá-lo automaticamente pelo `chestIllustrationMedia.ts`. Sem arquivo, permanece a mídia anterior.

Para importar via clone local: `node scripts/import-chest-illustrations.mjs /caminho/para/ilustracoes`.

Revisar as ilustrações antes da publicação, sobretudo variações de mesmo equipamento e posição do movimento.
