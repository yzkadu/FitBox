# FitBox — acompanhamento das sete frentes (09/11/2026)

Este arquivo registra entregas verificáveis, limites reais e próximos critérios de aceite. **Marcação de tarefa não significa que todo o aplicativo foi testado manualmente.**

| Frente | Situação | Já integrado à main | Restante para aceitar como finalizado |
|---|---|---|---|
| 1. Dados, cadastro e sincronização | **Parcial** | PR #6: aviso e reenvio para edições de séries, fichas e agenda; PR #7: criação de fichas e sessões com confirmação e reenvio; aviso é limpo no logout | Persistir fila de reenvios entre fechamentos; testar offline, múltiplos aparelhos, exclusões e operações restantes; revisar todos os caminhos de erro |
| 2. Navegação e Home | **Implementado, faltam testes visuais** | PR #1: cinco abas mobile; PR #2: treino antes da nutrição na Home | Conferir em iOS/Android, menu Mais, leitor de tela, telas pequenas |
| 3. Montagem e execução de treinos | **Parcial** | PR #6: progresso de séries na sessão, sem alterar histórico anterior | Testes de edição, descanso, duplicação, recuperação e usabilidade |
| 4. Programas e treinador IA | **Parcial** | PR #6: preserva fichas ao combinar; restringe sessões pela capacidade semanal; impede aplicação duplicada de propostas e esclarece dados usados | Validar programas reais, recomendações, recuperação, mudanças aprovadas e indisponibilidade da IA |
| 5. Nutrição e evolução | **Parcial** | PR #2: reutilização de refeições e paginação; PR #6: média de macros dos dias registrados nos últimos sete dias | Favoritos, receitas/porções, gráficos integrados de peso/força, revisão dos indicadores em telas pequenas |
| 6. Imagens e catálogo visual | **Pendente de arquivos binários** | PRs #3 e #4: 238/327 IDs com mídia externa; PR #5 **rascunho**, com associação dos 89 quadros enviados e inventário de 327 IDs | Adicionar 89 WebP a `public/exercise-guide/`, vincular a interface, revisar técnica de cada imagem e padronizar as outras 238 |
| 7. Testes, segurança e publicação | **Parcial** | PR #6: `npm test` e lint no CI, além do build/typecheck já existente; verificações dos PRs #6/#7 passaram | End-to-end autenticado, ambiente mobile, segurança e verificação final de deploy Vercel |

## Evidências no GitHub

- PR #1: https://github.com/yzkadu/FitBox/pull/1
- PR #2: https://github.com/yzkadu/FitBox/pull/2
- PR #3: https://github.com/yzkadu/FitBox/pull/3
- PR #4: https://github.com/yzkadu/FitBox/pull/4
- PR #5 (rascunho, imagens ainda sem WebP no Git): https://github.com/yzkadu/FitBox/pull/5
- PR #6: https://github.com/yzkadu/FitBox/pull/6
- PR #7: https://github.com/yzkadu/FitBox/pull/7

## Auditoria externa (somente leitura)

Supabase FitBox reportou em 09/11/2026:
- Security advisor: aviso de proteção contra senhas vazadas desativada; configuração de Auth precisa de revisão na área de segurança.
- Performance advisor: sete índices de chaves estrangeiras ausentes e 11 avisos de performance por reavaliação de funções Auth em políticas RLS. **Não modificamos o banco de produção** nesta rodada.
- GitHub CI: avisou duas vulnerabilidades de alta severidade na auditoria de dependências (detalhes exatos ainda não diagnosticados).

## Critérios de encerramento das sete frentes

1. Operações críticas exibem status de confirmação/erro e podem ser recuperadas sem duplicação.
2. Testes autenticados no app publicado em celular e desktop.
3. Biblioteca de exercícios com todas as imagens presentes, URLs acessíveis e ilustrações revisadas.
4. CI com build, lint, regressões e testes de interação passando.
5. Avisos de segurança e performance triados e corrigidos quando aplicável, sem aplicar alterações destrutivas sem validação.
