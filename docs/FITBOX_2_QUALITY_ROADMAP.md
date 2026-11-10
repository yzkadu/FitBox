# FitBox 2.0 — Plano de qualidade orientado ao usuário

Este documento separa o que está **implementado** do que permanece **planejado**. Nenhuma funcionalidade é considerada concluída sem compilação, teste no navegador mobile e verificação de persistência após recarregar e trocar de dispositivo.

## Princípios de experiência
1. Uma ação principal por tela, sem esconder recursos já existentes.
2. Sempre deixar claro se um dado foi **salvo no servidor**, está **pendente** ou **não sincronizou**.
3. Não alterar/excluir treinos, refeições ou metas sem uma confirmação explícita do usuário.
4. Não afirmar que fotos demonstram movimentos se não foram revisadas; preservar autoria/licença.
5. Recomendações do treinador precisam de explicação e aprovação antes da aplicação.

## Entregas nesta branch
- Menu mobile de cinco seções herdado de `feat/fitbox-2-mobile-navigation` (Hoje, Treinar, Explorar, Evolução e Mais). Recursos antigos continuam acessíveis.
- Página inicial dá prioridade às atividades planejadas antes do resumo nutricional.
- Nutrição: reaproveitar valores previamente registrados de uma refeição na ficha de lançamento, exigindo revisão e confirmação antes de salvar.
- Nutrição: histórico carregado em páginas de até mil registros em vez de truncado em 365.

## Backlog por jornada (critérios de aceite)
### 1. Conta e onboarding
- Cadastro inicial rápido; dados complementares opcionais e editáveis.
- Retomar cadastro interrompido sem perder os dados.
- Testar contas novas, login, recuperação de senha, logout, troca de usuário e sessão expirada.

### 2. Hoje
- Destacar treino ativo, opção planejada e descanso antes de indicadores secundários.
- Indicadores claros de cardio, treino e nutrição; sem pressão para completar toda atividade opcional.
- Estados vazios que explicam a próxima ação; usar apenas métricas calculadas a partir de registros reais.

### 3. Treinar / montar treino
- Uma entrada principal para criar, com rotas identificáveis para programa pronto, montador guiado, IA e manual.
- Permitir selecionar equipamentos estruturados (máquina, cabo, peso livre, peso corporal etc.).
- Manter versões e histórico quando editar treinos existentes.
- Validar duplicações de ficha, remoção, programação livre, exercícios substitutos e reordenação.

### 4. Programas prontos e combinação
- Mostrar objetivo, nível, equipamento, dias/semana, duração e prévia de cada semana.
- Combinar modalidades sem descartar silenciosamente uma ficha nem ultrapassar volume/recuperação planejados.
- Prévia e aprovação antes de aplicar programa na agenda; possibilitar desfazer a aplicação.

### 5. Sessão ativa
- Registrar cada série de forma independente; sugerir a última carga como referência, sem fixá-la.
- Descanso, série seguinte e estado de salvamento visíveis.
- Recuperar sessão interrompida sem criar duplicidade; finalizar apenas após persistir.
- Testar queda de internet, toque duplo, atualização da página e navegação para trás.

### 6. Cardio e HYROX
- Execução por blocos, intervalos e estações; cronômetro legível e pausa/retomada.
- Diferenciar treino planejado de atividade registrada; permitir adaptações seguras por equipamento.
- Não inferir distância, pace ou calorias sem dados medidos ou informados.

### 7. Biblioteca e demonstrações
- Auditar cada exercício por ID, equipamento, musculatura, variante e instrução.
- Não mostrar imagem incompatível como demonstração; evidenciar ausência de demonstração validada.
- Alternativas de execução e erros comuns com revisão humana; mapa anatômico separado da execução.

### 8. Nutrição
- Refeições recentes reutilizáveis (implementado neste PR), depois favoritos/receitas com porções.
- Busca em base de composição nutricional auditada; sempre deixar visível a fonte e a porção.
- Edição sem apagar histórico; testar metas, dias anteriores, exclusão e sincronização.
- Evitar prescrição automática de restrição calórica extrema e julgamentos por metas diárias.

### 9. Evolução
- Gráficos de tendência de peso, medidas, força, cardio e adesão ao longo do tempo.
- Distinguir ausência de dados de estabilidade; permitir comparação por períodos.
- Exportar histórico e excluir informações mediante solicitação autenticada.

### 10. Treinador IA
- Contexto por dados autorizados e disponíveis; explicar informações usadas.
- Sugestões com mudanças propostas e justificativa, não alteração automática.
- Preservar exercícios fundamentais para progressão; considerar descanso e restrições informadas.
- Validar comportamento quando a IA estiver indisponível ou responder sem proposta aplicável.

### 11. Confiabilidade e privacidade (bloqueador de publicação)
- Estados de sincronização reais e fila de retentativas para alterações offline se o modo offline for oferecido.
- Proteção do usuário por RLS e revisão dos dados expostos a serviços externos.
- Testar fluxos críticos em mobile e desktop, build, lint, acessibilidade e autenticação.
- Verificar a implantação da Vercel e exercitar o aplicativo publicado antes de divulgar como concluído.

## Cenários obrigatórios de aceite
1. Conta nova conclui cadastro e inicia um treino sem tutorial.
2. Conta com treinos antigos atualiza o app sem perder histórico.
3. Duas sessões no mesmo dia continuam independentes e não são contabilizadas em duplicidade.
4. Uma refeição pode ser repetida, ajustada e registrada em outra data.
5. O histórico alimentar com mais de 365 registros é carregado e consultável.
6. Navegação em tela estreita permite acessar todas as áreas.
7. Queda de conexão gera erro explícito e não afirma que uma alteração foi salva.
8. Uma proposta de IA não é aplicada antes da confirmação.
9. Fotos sem licença ou correspondência biomecânica não são apresentadas como instrução validada.
10. Logout e login em outra conta não expõem dados da conta anterior.

## Prioridade
**P0:** integridade de dados, autenticação, sincronização, testes críticos.
**P1:** criação de treino, Home, sessão, programas, imagens de execução.
**P2:** nutrição mais ágil, acompanhamento de evolução, IA adaptativa.
**P3:** refinamentos visuais e personalização avançada.

## Progresso verificado em 10/11/2026

- [x] PR #19: miniaturas e correções dos vínculos de mídia (integrado).
- [x] PR #20: atlas de pernas, glúteos e panturrilhas (integrado).
- [x] PR #21: guia abdominal (integrado).
- [x] PR #22: mobilidade, antebraço, cardio, HYROX e funcional (integrado).
- [x] PR #23: circuito HYROX por voltas e estações (integrado).
- [x] PR #24: atlas original das últimas 22 ilustrações, arquivo WebP efetivamente incluído (integrado).
- [x] PR #25: formatos AMRAP, EMOM e For Time; resultado real informado por estação (integrado).
- [x] Auditoria estática: 330 IDs únicos no catálogo, todos com vínculo declarado de mídia; 11 atlas WebP presentes. Vínculo **não comprova** que cada foto remota carrega nem que a pose está tecnicamente correta.
- [ ] Inspeção visual autenticada em celular e desktop para cada exercício, incluindo faixas azuis, zoom e corpo/equipamento cortado.
- [ ] Validar links externos de fotografias, créditos e correspondência biomecânica com revisão humana.
- [ ] Exercitar ponta a ponta criação/edição/duplicação/conclusão de treino, queda de rede, autenticação e sincronização Supabase.
- [ ] EMOM com alertas de troca de estação, cronômetro pausável e blocos mistos (aquecimento/circuito/desaquecimento).
- [ ] P0 geral: proteção de sessão, testes multiusuário e persistência após troca de dispositivo.

### PRs antigas que exigem decisão antes de qualquer merge

- **#13:** remoção da interface de nutrição contradiz uso atual do módulo; não integrar automaticamente.
- **#8:** mapeamento de apenas 238/327 exercícios está obsoleto; comparar IDs antes de reutilizar qualquer patch.
- **#5:** pacote original de 89 ilustrações contém histórico de pendência binária; evitar duplicar os atlas agora integrados.

**Critério de conclusão:** CI verde e preview Vercel são necessários, mas não substituem QA autenticado e verificação visual dos movimentos.
