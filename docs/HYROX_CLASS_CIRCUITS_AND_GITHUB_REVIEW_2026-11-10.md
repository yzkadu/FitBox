# Revisão do montador HYROX e pendências abertas — 10/11/2026

## Situação real

- [x] PR #23 incorporado ao `main`: circuito por voltas e estações, com CI aprovado.
- [x] Fichas convencionais preservadas e sem migração de banco; configuração guardada no JSON dos exercícios.
- [x] Inserção rápida de sequência por linhas `Nome do catálogo | meta` com bloqueio se um nome não existir.
- [ ] Teste manual completo em conta autenticada no celular, incluindo iniciar circuito, finalizar, recarregar, duplicar e trocar de aparelho.
- [ ] Editor com blocos mistos: aquecimento, força, técnica, circuito e desaquecimento dentro da mesma aula.
- [x] PR #25 incorporado ao `main`: AMRAP com adição de volta, EMOM com indicador do minuto e For Time com relógio; resultado real em texto separado da meta.\n- [ ] Controle avançado do cronômetro (pausa/retomada, sinal de minuto EMOM, intervalos de trabalho/descanso e rodadas parciais).
- [x] Campo para registrar manualmente resultado real por estação, inclusive distância/tempo, separado da meta planejada; ainda não há sensor ou medição automática.
- [ ] Alterar o circuito em andamento quando o professor mudar a sequência, preservando voltas anteriores e as alterações já registradas.
- [ ] Permitir cadastrar uma estação nova durante a sessão e escolher em quais voltas restantes ela aparece.
- [ ] Modo rápido para fotografar/transcrever quadro da aula, sempre com conferência de nomes e metas antes de criar exercícios.

## Revisão das PRs antigas

- **#13 — Remover Nutrição:** pedido diferente dos fluxos nutricionais ainda documentados e utilizados. Não fazer merge sem resolver a escolha de produto (remover interface, mas preservar dados), além da possível divergência de branch.
- **#8 — Uma imagem por exercício:** referência de cobertura antiga (238/327); reavaliar com o catálogo atual (329 IDs e novos atlas ilustrados), evitando reintroduzir imagens incorretas ou substituir recortes já aprovados.
- **#5 — pacote de 89 imagens:** aviso de binários pendentes é histórico; comparar os IDs e os atlas efetivamente presentes antes de reutilizar os scripts ou incluir duplicatas.

## Critérios de aceite para a próxima etapa

1. Criar circuito com 3 voltas e as estações SkiErg, sled push, remo e wall ball; a sessão deve seguir a ordem 1→2→3→4, repetida nas três voltas.
2. Concluir uma estação sem repetições numéricas quando a meta for tempo/distância, preservando o texto da meta e sem gerar uma medida fictícia.
3. Duplicar e reabrir a ficha sem perder modo, voltas, descanso, ordem ou notas.
4. Treinos tradicionais e históricos anteriores continuam intactos.
5. QA autenticado, build, lint e testes devem estar verdes antes de merge.

*Importante: registrar entrega em branch não equivale a implantação em produção.*
