# FitBox — reconciliação dos PRs visuais antigos (#5 e #8)

Data da revisão: 11/11/2026. Escopo **não destrutivo**.

## Auditoria objetiva do antigo guia de 89 exercícios (#5)

- O catálogo atual contém **330 IDs únicos**.
- O PR #5 contém um mapeamento antigo de **89 IDs** (na época, o catálogo tinha 327).
- **89/89 IDs continuam cadastrados** no catálogo atual.
- **89/89 têm alguma fonte de mídia identificada no código atual**, entre os atlas originais e o acervo fotográfico; esse vínculo é conferido em `tests/legacy-visual-reconciliation.test.mjs`.
- **88/89 aparecem nas listas de atlas locais**. A exceção é `ex-new-extensoracompausa`, que tem vínculo no módulo fotográfico `lowerBodyPhotoMedia.ts`. Isto não garante que sua URL remota funcione nem substitui conferir a técnica.
- Nenhum WebP antigo, mapeamento desatualizado ou caminho inexistente foi reaplicado. Os atlas atuais permanecem como fontes prioritárias.
- A presença do mapeamento **não confirma** que todos os 89 quadros estejam corretos, publicados, sem cortes ou tecnicamente adequados.

**Decisão:** não integrar automaticamente o PR #5 (rascunho de 327 IDs e binários não incluídos). A eventual atualização/encerramento do PR exige decisão do responsável; o PR fica preservado.

## Padronização das imagens (#8)

A versão atual de `ExerciseVisual.tsx` já utiliza as imagens específicas por ID, atlas locais e o mapa muscular separado.

Nesta atualização, a tela "Como executar" passa a exibir **uma imagem de execução principal por padrão**. Se houver uma segunda fotografia, um botão "Ver segunda posição" a torna acessível; nada foi excluído do acervo. A miniatura permanece com uma imagem.

**Decisão:** não mesclar a branch antiga #8, em conflito com `main`: seu código é anterior às correções de miniaturas, recortes e atlas atuais. A funcionalidade útil foi reconstruída de modo aditivo sobre a versão atual.

## O que continua pendente para qualidade final

- QA visual do catálogo em iOS/Android e em sessão autenticada; nenhum teste de texto comprova enquadramento ou biomecânica.
- Conferência HTTP de imagens remotas e de cada asset no deploy efetivamente ativo.
- Revisão profissional das ilustrações e das 27 classificações anatômicas de confiança moderada.
- Recuperação de gravações quando o app é fechado offline; sincronização autenticada em dispositivos diferentes.
- Verificação do deploy da Vercel após o merge: CI verde não significa implantação de produção.
- **Não excluir** dados, fotos, telas, exercícios, branches ou PRs antigos sem autorização específica.

## Testes

`tests/legacy-visual-reconciliation.test.mjs` confere todos os 89 IDs históricos, a presença de vínculos ativos, prioridade das fontes atuais e a segunda posição fotográfica preservada.
