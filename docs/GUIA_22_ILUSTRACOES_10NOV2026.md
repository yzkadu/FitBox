# 22 ilustrações complementares — 10/11/2026

Recebidas **5 páginas** de referência em conversa: 4 ombros, 9 pernas, 4 glúteos e 5 tríceps. Não criar exercícios duplicados: todos os 22 IDs já existem no catálogo.

## Arquivo pronto e destino

O pacote gerado nesta conversa é `FitBox_22_ilustracoes_prontas.zip`, contendo `sprite.webp` (atlas WebP de 5 colunas × 5 linhas, com 22 quadros), `mapping.json` e `README.txt`.

Os vínculos implementados neste PR utilizam o arquivo **incluído no repositório**:

`src/assets/exercise-guide/supplement-22/sprite.webp`

O WebP original em resolução 1400 × 1100 está versionado como blob Git. O `import.meta.glob` ativa as imagens somente quando o arquivo está realmente no bundle; a mídia anterior permanece como fallback quando o arquivo não existe. A presença do binário foi verificada; inspeção final no dispositivo real continua recomendada.

## Ordem dos 22 quadros

1–4: elevação lateral cabo; elevação lateral máquina; face pull elástico; push press halteres.

5–9: búlgaro; leg press horizontal; afundo/passada; Cossack; leg press unilateral.

10–13: wall sit; afundo reverso; Nordic curl; passada lateral.

14–17: stiff unilateral; ponte miniband; elevação pélvica TRX; agachamento miniband.

18–22: tríceps coice cabo; tríceps banco pés elevados; extensão tríceps elástico; supino fechado halteres; flexão diamante.

## QA obrigatório

- Compilar, fazer lint e rodar testes; verificar que nenhuma das 22 imagens aponta para exercício parecido com equipamento diferente.
- Incluir o WebP e conferir em cada exercício que o recorte não apresenta cabeçalho azul, margens ou corte de corpo/aparelho.
- Abrir miniatura e guia completo no mobile; testar refresh e mudança de conta.
- Validar a atualização do deploy Vercel após merge.

## Estado desta branch

Mapeamento concluído e atlas binário original incluído no GitHub. As duas pipelines de validação e o status de preview Vercel terminaram com sucesso no commit `65c2074`. A verificação manual em dispositivos físicos, autenticação e diferentes larguras de tela permanece pendente.
