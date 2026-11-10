# FitBox — Integração anatômica dos 330 exercícios (10/11/2026)

## Fonte e compatibilidade
- Fonte: ZIP fornecido pela pessoa responsável pelo FitBox, arquivo `dados/fitbox_exercicios_ATUAIS_330_musculos.json`.
- Dado incorporado: `src/data/anatomy330.json`, com **330 IDs únicos**. Comparação com `src/lib/exercises.ts` + `src/lib/extraExercises.ts`: **330/330 IDs coincidentes**, sem IDs adicionados, removidos ou renomeados.
- Os dados são estimativas biomecânicas, não EMG nem medida individual de ativação ou crescimento. A prioridade é preservar nomes, imagens, treinos, programas, agendas e históricos de usuários.
- A classificação é independente do campo histórico `muscleGroup` e usa ID como referência. Nenhuma migração Supabase é exigida.

## Implementado
- `src/lib/anatomicalProfiles.ts`: converte músculos principais, secundários, estabilizadores, região, padrão, família, modalidade, confiabilidade e elegibilidade em perfis consultáveis. Exercícios pessoais não recebem porção muscular inventada.
- `src/lib/anatomicalSelection.ts`: motor de seleção automático por grupo, família e região, penalizando padrões redundantes, com tolerância à cobertura distribuída na semana. Evita excluir manualmente variantes equivalentes.
- `guidedBuilder.ts`: balanceamento automático aplicado somente a fichas de força; equipamentos/nível/local compatíveis antes da escolha, respeito ao número de slots, séries e grupos do programa. Circuitos HYROX não são reorganizados.
- `programRecommendation.ts`: balanceamento nos treinos de força criados por pools no onboarding. Programas curados mantêm a sequência, mas variantes marcadas `sugerir_automaticamente=false` não são sugeridas.
- `GuidedBuilder.tsx`: resumo de cobertura **direta planejada** por região e família, justificativa de cada seleção e alerta qualitativo de sobreposição entre dias consecutivos.
- `ExerciseDetail.tsx`: músculos principais, secundários, estabilizadores, padrão, ênfase e incerteza técnica, separados da imagem de execução e do mapa muscular.
- `tests/anatomy330.test.mjs`: schema, 330 IDs, checagens de modalidade, detalhes de supino e 4 exercícios que exigem revisão técnica.

## Pendente de validação/novas etapas
- Testes autenticados em dispositivos reais e revisão por profissional de treinamento, especialmente 27 classificações de confiança moderada.
- Otimização integrada ao Coach IA e a todos os programas de treino de outras jornadas, após revisar prioridades de produto.
- Restrição/lesões pessoais específicas não são coletadas no montador atual; o algoritmo não deve alegar aplicar contraindicações clínicas individualizadas.
- A recuperação semanal ainda utiliza alertas qualitativos de sobreposição de regiões diretas, não análise fisiológica ou prescrição.
- Revisar cenários de 3 e 6 slots em Peito+Bíceps, força de dois dias e modalidades mistas, além da acessibilidade mobile.
- As imagens de demonstração **não foram alteradas**. Validação visual/biomecânica das imagens é um trabalho separado.
- Nenhuma publicação de produção autorizada automaticamente por este pacote: as alterações permanecem em PR para revisão.

**Critério de conclusão:** CI verde + revisão técnica + teste autenticado de edição e gravação antes de afirmar prontidão clínica ou de produção.
