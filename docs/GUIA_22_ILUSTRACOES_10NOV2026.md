# 22 ilustrações complementares — 10/11/2026

Recebidas **5 páginas** de referência em conversa: 4 ombros, 9 pernas, 4 glúteos e 5 tríceps. Não criar exercícios duplicados: todos os 22 IDs já existem no catálogo.

## Arquivo pronto e destino

O pacote gerado nesta conversa é `FitBox_22_ilustracoes_prontas.zip`, contendo `sprite.webp` (atlas WebP de 5 colunas × 5 linhas, com 22 quadros), `mapping.json` e `README.txt`.

Para ativar os vínculos implementados neste PR é **obrigatório incluir fisicamente** o arquivo:

`src/assets/exercise-guide/supplement-22/sprite.webp`

O mecanismo de `import.meta.glob` só ativa a substituição quando esse arquivo realmente estiver no código compilado. Sem o binário, permanece a mídia anterior, para não aparecer imagem quebrada. **Não afirmar integração visual concluída até o WebP estar commitado.**

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

Mapeamento feito. Binário local extraído dos uploads, porém **ainda não transferido ao GitHub por limitação de upload binário do conector disponível nesta conversa**. Não integrar esta branch sozinha se a intenção for publicar todas as 22 ilustrações.
