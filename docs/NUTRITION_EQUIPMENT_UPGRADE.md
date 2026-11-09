# FitBox — Equipamentos e Nutrição

## Equipamentos no catálogo e no montador

O filtro antigo de **Especialidades** foi removido de `ExercisePicker.tsx`.
Agora é possível filtrar por **Peso corporal, Peso livre, Máquinas, Cabo/Polia,
Elásticos, Barra fixa/TRX/Argolas, Cardio/HYROX, Outros/a verificar**.
A seleção é múltipla e reaproveitada no novo montador de semana (sem reescrever
treinos antigos).

A classificação de cada exercício é estimada pelas informações de equipamento
e nome que já existiam no catálogo. `Outros/a verificar` reúne exercícios
ambíguos: não deve ser rotulado como equipamento específico sem revisão.
Fonte: `src/lib/equipmentCategories.ts`.

## Nutrição e metas

Nova rota `/nutricao`, ligada pela **Home**, pela área de **Evolução e metas**
e pelo menu lateral desktop.

A pessoa pode:
- definir ou editar suas **metas pessoais** de calorias, proteínas, carboidratos
  e gorduras por dia, com objetivo opcional de emagrecer/ganhar massa/manter;
- registrar refeição com nome, data, kcal e gramas de cada macro;
- escolher entre informar calorias diretamente ou estimá-las pelos macros
  (4 kcal/g de proteínas e carboidratos, 9 kcal/g de gorduras);
- acompanhar registros e proporções de meta em dias anteriores ou hoje;
- excluir entradas registradas incorretamente.

A tela mostra a **meta de peso existente** como contexto, mas não altera
automaticamente calorias nem prescreve déficits pela meta de emagrecimento.
Não existe reconhecimento de alimentos ou base nutricional automática nesta fase.
O usuário deve informar os valores da porção realmente consumida.

## Persistência e segurança

Banco: projeto Supabase FitBox, migração
`fitbox_nutrition_goals_entries_rls`, duas tabelas:

- `public.nutrition_goals`: uma meta por usuário, editável;
- `public.nutrition_entries`: registros por dia e usuário, com campos numéricos.

Ambas têm RLS habilitada e políticas de SELECT/INSERT/UPDATE/DELETE restritas
a `auth.uid() = user_id`. Não armazenamos informações de dieta em metadados
públicos ou chaves do frontend. Salvar e excluir aguardam resposta do servidor;
falha de rede não é reportada como sucesso.

O store do app sincroniza metas e as **365 entradas mais recentes** para
o estado local; entradas anteriores permanecem no banco, mas não são buscadas
pela versão atual. Dados locais ficam no cache por conta, da mesma forma que
o histórico de treino; não são compartilhados entre contas.

## Acompanhamento

- Validar visualmente layouts pequenos e teste manual logado na versão publicada.
- Adicionar edição de refeição e busca de alimentos com fonte licenciada,
  caso necessário em outra etapa.
- Se evoluir para sugestões de metas, deixar claro que são estimativas e
  evitar ajustes extremos de calorias ou interpretações médicas.
