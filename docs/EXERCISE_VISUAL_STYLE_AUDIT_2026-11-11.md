# Auditoria de estilo das imagens de execução — 11/11/2026

**Requisito:** manter o padrão de ilustração (como a referência de agachamento hack enviada pelo usuário), sem fotografias misturadas no guia de execução.

Inspeção estática do catálogo atual: **329 exercícios únicos**, **319 com associação de atlas ilustrado**, **10 com fotografia em vez de ilustração**, **nenhum sem associação de mídia**. Os 330 registros de `anatomy330.json` não devem ser confundidos com os 329 IDs efetivos do catálogo; revisar divergência separadamente antes de adicionar/remover registros.

A auditoria verifica o tipo de mídia configurado pelo código e a prioridade do resolvedor; **não substitui inspeção visual no app ou validação biomecânica**. As 319 associações ilustradas precisam de revisão individual de desenho e enquadramento.

| # | Exercício | ID | Foto externa atualmente utilizada |
|---|---|---|---|
| 1 | Agachamento hack | `ex-agachamento-hack` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hack_Squat/0.jpg) |
| 2 | Cadeira adutora | `ex-cadeira-adutora` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Thigh_Adductor/0.jpg) |
| 3 | Panturrilha burro | `ex-fedb-donkey-calf-raises` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Donkey_Calf_Raises/0.jpg) |
| 4 | Rosca no banco inclinado | `ex-new-roscanobancoinclinado` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Curl/0.jpg) |
| 5 | Extensora com pausa | `ex-new-extensoracompausa` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg) |
| 6 | Extensão de quadril em quatro apoios | `ex-new-extensaodequadrilemquatroapoios` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Glute_Kickback/0.jpg) |
| 7 | Pull through no cabo | `ex-new-pullthroughnocabo` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pull_Through/0.jpg) |
| 8 | Passada para trás com halteres | `ex-new-passadaparatrascomhalteres` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Rear_Lunge/0.jpg) |
| 9 | Caminhada lateral com miniband | `ex-new-caminhadalateralcomminiband` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Monster_Walk/0.jpg) |
| 10 | Russian twist com anilha | `ex-new-russiantwistcomanilha` | [0.jpg](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Russian_Twist/0.jpg) |

## Entrega e próxima etapa

- [x] Plano renomeado para **Upper / HYROX / Lower · 5 dias**, preservando seu ID, fichas e histórico.
- [x] Filtro da biblioteca renomeado para **Upper / HYROX / Lower** (em lugar de “Meu plano”).
- [x] Listagem com links das **10 fotografias vinculadas**, para substituir pelo padrão ilustrado.
- [x] Exemplo de agachamento hack **recebido nesta conversa**; a mídia ainda **não foi substituída no código** nesta atualização.
- [ ] Usuário fornecer as ilustrações faltantes (9 exercícios além do hack); validá-las por movimento e equipamento.
- [ ] Integrar recortes originais sem faixas de cabeçalho, conferir IDs, composição e proporções; preservar fotos atuais até a implantação e **pedir autorização antes de excluir qualquer arquivo**.
- [ ] Verificar imagens efetivamente renderizadas em Safari iPhone e outras telas. Não concluir QA só pelo mapeamento.

A prancha visual interativa foi entregue como arquivo na conversa: `fitbox_prancha_10_imagens_fora_padrao.html`; as fotos de 9 exercícios são carregadas pelas mesmas URLs externas de origem do app ao abrir com conexão à internet.
