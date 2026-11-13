# Registro rápido de atividades — FitBox

O recurso **Atividades** permite registrar um exercício físico concluído sem criar
uma ficha. Escolha HYROX, funcional, caminhada, musculação livre, cardio livre,
esporte, mobilidade ou um nome personalizado; informe data e tempo em minutos.
Kcal, frequência cardíaca, esforço percebido e notas são opcionais.

## Regras

- A data pode ser retroativa. O atalho **Registrar ontem** seleciona ontem no fuso local do dispositivo.
- O sistema nunca estima kcal sem dados: registra exclusivamente o que o usuário informa.
- Uma atividade rápida concluída, cardio ou sessão encerrada contam como **um dia ativo** na data local.
- HYROX + cardio + musculação no mesmo dia **não triplicam** o foguinho.
- Login, treino aberto ou formulário incompleto **não** contam.
- A lista de registros rápidos pode ser consultada em **Atividades** ou **Histórico**.
- Remoções e inclusões exigem confirmação do Supabase antes de atualizar a contagem na interface.
- A estrutura usa uma tabela própria `public.activity_logs` com RLS por usuário.
- Nenhum exercício, treino ou lançamento de cardio já existente é alterado.

## Exemplo para inserir após a publicação

Em **Hoje → Registrar atividade rápida → Registrar ontem**, selecione HYROX,
informe os minutos realizados e, se tiver a medição do relógio, informe as kcal.
Confirme em **Salvar atividade**. Essa ação afeta automaticamente o foguinho e
a frequência, e aparece no histórico.
