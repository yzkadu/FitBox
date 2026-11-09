# Integração das 89 ilustrações enviadas pelo usuário

## Arquivos disponíveis

O pacote **fitbox-89-execucoes-recortadas.zip** contém duas pastas:
- `execucoes/` — ilustrações sem cabeçalho (preferidas para o app)
- `cards/` — quadros completos com títulos da arte original

Os nomes dos arquivos seguem a numeração de 01.webp a 89.webp. O código `src/lib/userExecutionGuide.ts` associa cada número ao ID permanente do exercício. O documento `docs/FITBOX_CATALOGO_VISUAL_COMPLETO.md` e o CSV correspondente listam **todos os 327 exercícios**, distinguindo imagens anteriores dos novos quadros.

## Como instalar no repositório

1. Obter o ZIP fornecido nesta conversa e descompactar.
2. Executar `node scripts/import-exercise-guide.mjs /caminho/para/execucoes` na raiz do repositório.
3. Verificar que os 89 arquivos estão em `public/exercise-guide/01.webp` até `89.webp`.
4. Depois de acrescentar os arquivos à branch, habilitar `USER_EXECUTION_GUIDE` como fonte para os IDs correspondentes no módulo `src/lib/exerciseMedia.ts` e distinguir ilustração de foto real na interface.
5. Rodar o build, conferir os arquivos na prévia da Vercel e revisar visualmente cada execução antes de integrar à main.

**Importante:** os arquivos binários WebP ainda não estão presentes nesta branch. O mapeamento foi preparado; não ativamos URLs inexistentes no app para evitar imagens quebradas e regressões. A inclusão dos assets e a ligação da UI são requisitos pendentes para concluir a publicação.

## Qualidade

As nove páginas foram recebidas como ilustrações, não fotos. Algumas imagens mostram etapas de movimento com simplificações biomecânicas; revisar postura, amplitude, equipamento, rotações e setas antes de certificar como instrução segura. Não criar um carimbo de "validado" automaticamente por ter imagem.
