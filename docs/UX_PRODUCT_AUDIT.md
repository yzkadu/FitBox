# FitBox — auditoria do produto e plano de UX

Data de revisão: 04/11/2026. Produto: React + Vite, GitHub e deploy Vercel.
Este documento distingue alterações de código feitas nesta etapa e pendências reais.
Não representa teste manual com conta autenticada.

## Diagnóstico do fluxo anterior

A tela **Meus treinos** priorizava uma lista/agenda extensa; o acesso a Programas prontos
era um cartão discreto; a criação manual usava um botão de ícone com pouca pista;
a criação por IA estava atrás de outro botão de ícone. A biblioteca de programas
abria com todos os filtros expandidos e o detalhamento dos exercícios antes das ações
para adotar o programa. O menu mobile não tinha acesso direto à biblioteca.
O link da tela Cardio apontava para `/treinos/programas`, rota não registrada.

## Ajustes implementados

- Tela **Meus treinos**: entrada destacada para **Programas prontos**, botões
  **Criar com IA** e **Criar do zero**, com explicações do que acontece em cada caminho.
- Criador manual: preencher **nome da ficha primeiro**, sugestões de nome, seletor de
  ícone opcional e recolhido; em seguida abre o editor da ficha.
- Busca pelo nome das fichas já criadas e agenda semanal recolhida em
  **Organizar minha semana** (nenhuma agenda foi alterada automaticamente).
- Biblioteca de programas: campo de busca, categorias rápidas (Emagrecimento,
  Musculação, HYROX, Corrida / esteira, Em casa) e filtros avançados recolhidos.
- Lista detalhada dos exercícios de cada programa recolhível; botões de
  adicionar ficam acessíveis antes do detalhamento extenso.
- Ativar agenda sugerida agora exige confirmação, pois substitui os sete dias.
- Menus mobile/desktop com acesso direto a **Programas prontos**.
- Corrigida navegação da seção Cardio para a rota existente `/programas`.

## Experiência recomendada do usuário

1. **Hoje**: ver o que está disponível, executar ou registrar atividade.
2. **Prontos**: pesquisar por objetivo, nível, equipamento e dias; visualizar
   semana e exercícios; adicionar fichas ou confirmar agenda.
3. **Meus treinos**: encontrar e editar suas fichas; criar outra manualmente
   ou via IA; organizar a agenda somente quando desejar.
4. **Durante o treino**: ver execução e músculos trabalhados; registrar
   cada série separadamente; controlar descanso.
5. **Histórico / evolução / medidas**: acompanhar resultados.

## Pendências prioritárias

### Prioridade 0 — validação e estabilidade

- Teste real em telefone pequeno e desktop, principalmente acesso a
  Programas prontos, criação manual/IA e troca de agenda.
- Verificar se backend persiste criações e mudanças após logout/reload.
- Validar fotos remotas em rede móvel e exibição de erro.
- Rever fluxo da aba Cardio com treinos prontos e registro (rotas e dados).
- Testar acessibilidade: teclado, labels, contraste, zoom e orientação.

### Prioridade 1 — montador realmente dinâmico

- Introduzir entidade persistente de **Programa ativo**, com ID, versões,
  sessões, calendário, progressão, preferências e histórico de alterações.
  Hoje, um programa pronto é convertido em fichas e agenda, perdendo o
  vínculo com o catálogo original.
- Assistente guiado: objetivo, equipamento, nível, dias disponíveis, tempo,
  modalidades e preferências; gerar prévia e permitir ajustes antes de salvar.
- Editor com reordenação de exercícios e sessões, duplicar ficha, copiar
  bloco, substituir exercício por variante equivalente COM indicação,
  superset/circuito, adicionar cardio com duração e intensidade.
- Combinador de programas: avaliar colisões de estímulo, volume, nível,
  descanso e impacto; gerar proposta de semana; nunca simplesmente somar
  duas programações completas.
- Rodízio semanal opcional com histórico e progressão; mostrar substituições
  propostas e pedir aprovação. Respeitar equipamentos, limitações e fadiga.

### Prioridade 2 — biblioteca e referências visuais

- Seguir auditoria de `docs/EXERCISE_IMAGE_AUDIT.md` para completar imagens,
  sem marcar foto incorreta como validada.
- Auditar ângulo, equipamento, pegada e movimento antes de inserir 1–2 fotos
  de execução real; personagem muscular pequeno e separado.
- A página Hipertrofia.org é ótima referência editorial para descobrir
  nomes, variações e fontes originais. **Não copiar nem hotlinkar** imagens
  sem licença/consentimento compatível (ver termos do editor).
  Link: https://www.hipertrofia.org/blog/termos-de-uso/
- Guardar para cada mídia: exerciseId, fonte, URL original, autor, licença,
  atribuição, variante, revisão visual e data de revisão.
- Testar no ambiente real para evitar fotos quebradas ou demonstrativos
  errados; permissões e acesso remoto podem mudar.

## Definição de concluído

- O primeiro acesso aos Programas prontos ocorre sem rolar em Meus treinos.
- Um usuário consegue encontrar um programa específico em poucos passos,
  entender o plano, optar por adicionar fichas sem mudar agenda ou confirmar
  a substituição da agenda.
- Criação manual e IA não exigem percorrer o editor semanal.
- A seleção de exercícios preserva o histórico, e as imagens exibidas
  são identificadas como fotos verdadeiras quando o movimento é conferido.
- Os fluxos básicos foram efetivamente testados em mobile, desktop e sessão
  autenticada, e não apenas aprovados pelo compilador.
