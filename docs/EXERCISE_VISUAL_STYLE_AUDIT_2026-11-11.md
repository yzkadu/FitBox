# Auditoria e atualização de imagens de execução — 11/11/2026

## Situação após o envio das novas imagens

O catálogo conserva os **329 IDs de exercício**. As **319 associações existentes a atlas ilustrados** foram preservadas; os **10 exercícios que antes usavam fotografias** recebem agora ilustrações WebP locais fornecidas pelo usuário. O resolvedor `exerciseMedia` dá prioridade à imagem recebida e mantém o acervo anterior como fallback técnico se a imagem nova estiver ausente no build.

As oito figuras da prancha composta foram recortadas em 8 cartões independentes, sem trocar a ordem, e as duas ilustrações individuais foram convertidas para WebP. As dimensões e o enquadramento originais foram mantidos proporcionalmente; não se alterou a técnica representada.

| Exercício | ID no catálogo | Novo arquivo |
|---|---|---|
| Agachamento hack | `ex-agachamento-hack` | `agachamento-hack.webp` |
| Cadeira adutora | `ex-cadeira-adutora` | `cadeira-adutora.webp` |
| Caminhada lateral com miniband | `ex-new-caminhadalateralcomminiband` | `caminhada-lateral-com-miniband.webp` |
| Extensão de quadril em quatro apoios | `ex-new-extensaodequadrilemquatroapoios` | `extensao-quadril-quatro-apoios.webp` |
| Extensora com pausa | `ex-new-extensoracompausa` | `extensora-com-pausa.webp` |
| Panturrilha burro | `ex-fedb-donkey-calf-raises` | `panturrilha-burro.webp` |
| Passada para trás com halteres | `ex-new-passadaparatrascomhalteres` | `passada-para-tras-com-halteres.webp` |
| Pull through no cabo | `ex-new-pullthroughnocabo` | `pull-through-no-cabo.webp` |
| Rosca no banco inclinado | `ex-new-roscanobancoinclinado` | `rosca-no-banco-inclinado.webp` |
| Russian twist com anilha | `ex-new-russiantwistcomanilha` | `russian-twist-com-anilha.webp` |

Arquivos: `src/assets/exercise-guide/user-updates-20261111/`.
Correspondência por ID: `src/lib/userProvidedIllustrationMedia.ts`.
Prioridade/fallback: `src/lib/exerciseMedia.ts`.

## QA e pendências

- [x] Novos dez binários WebP adicionados ao repositório, sem apagar as fotografias externas usadas anteriormente.
- [x] Vínculo por ID exato, sem uso de outro exercício como substituto.
- [x] Teste automático do formato dos dez arquivos e da prioridade de mídia.
- [x] Inventário estático atualizado para **329 associações ilustradas** e **zero exercícios apenas com fotografia**.
- [ ] Validar visualmente os dez cartões em Safari iPhone e desktop, especialmente redimensionamento e contraste.
- [ ] Inspeção biomecânica humana dos novos desenhos e dos demais 319 atlas ilustrados.
- [ ] Validar comportamento autenticado, sincronização e navegação de ponta a ponta em dispositivo real.

**Nota:** ter uma associação a ilustração não comprova que o desenho está tecnicamente perfeito. O registro `anatomy330.json` tem 330 entradas e não deve ser confundido com os 329 IDs efetivos do catálogo.
