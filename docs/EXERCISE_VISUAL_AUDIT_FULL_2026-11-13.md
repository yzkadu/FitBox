# Auditoria completa do catálogo visual FitBox — 13/11/2026

## Escopo auditado

Foram inspecionados os **331 IDs do catálogo**, 11 atlas ilustrados,
**322 células de atlas** (incluindo aparições repetidas) e 11 desenhos individuais
recentes. As imagens dos atlas foram conferidas em prévias visuais e por uma
rotina reproduzível de integridade do formato, dimensões, presença de conteúdo
e semelhança perceptual.

**Atenção:** uma inspeção de qualidade de imagem não substitui a revisão
biomecânica presencial. Este relatório não afirma que todos os 331 movimentos
foram validados por um profissional ou testados em todos os celulares.

## Problemas confirmados

1. O teste antigo contava **330** exercícios apesar dos **331 IDs reais**.
   Um nome contendo apóstrofo escapado era excluído pela regex de catálogo.
   Corrigimos o teste para verificar diretamente o ID estável.
2. O atlas de condicionamento tem **dois IDs repetidos**, shuttle run (26/46)
   e subida de escadas (32/47). O código anterior escolhia silenciosamente
   a **última** ocorrência; agora a primeira imagem permanece estável.
3. Tríceps e peito contêm outra duplicidade entre atlas
   (`ex-new-supinocompegadafechada`), preservada sem duplicar o registro.
4. As imagens de condicionamento exibem divisórias nos limites das células
   e alguns quadros com figuras pequenas demais em comparação com as demais.
   O novo processo normaliza cada célula em um WebP individual com fundo
   branco, enquadramento centralizado e margem uniforme, preservando o desenho.
5. O detector perceptual assinalou **16 pares de células semelhantes**.
   Não foram automaticamente trocadas porque variações de pegada e aparelho
   podem parecer semelhantes sem serem a mesma execução.

## Correções

- **319 arquivos normalizados** gerados com base nas 11 pranchas.
- **11 desenhos individuais do usuário preservados** com prioridade máxima.
- **1 alias biomecânico** de agachamento com salto para um segundo ID do
  catálogo, resultando em **331 exercícios cobertos**.
- O componente passa a usar os arquivos individuais e não depende mais
  dos recortes CSS de um atlas de 5 colunas para o fluxo principal.
- O atlas original fica no repositório como fonte e alternativa histórica.
- Testes detectam ID ausente, arquivo WebP não instalado, colisões de
  índices e regressão da ordem de prioridade.

## Pendências não verificáveis automaticamente

- Técnica biomecânica e variações extremamente próximas devem ser
  revisadas por um profissional, especialmente os 16 pares sinalizados.
- A inspeção autenticada no aplicativo publicado em telas móveis ainda
  depende de acesso ao ambiente da Vercel e teste visual do usuário.
- O desenho original pode ter anatomia imperfeita; reorganizar
  a arte não corrige erros presentes na imagem original.
