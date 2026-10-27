# FitBox 💪

Aplicativo web de treinos e acompanhamento de evolução física.

**Endereço de publicação indicado no repositório:** https://fit-box-gamma.vercel.app

## Funcionalidades existentes

- Cadastro e autenticação individuais com Supabase Auth.
- **Dados cadastrais**: nome, idade, sexo, altura, peso inicial, nível de experiência, frequência semanal e locais/equipamentos de treino, com edição na tela **Conta**.
- **Meta de peso**: escolher perder ou ganhar, informar quantidade em kg e ritmo em kg/semana; o app calcula automaticamente peso-alvo, semanas e data prevista, com opção de editar ou excluir.
- Montagem e execução de treinos, agenda semanal, cardio e histórico.
- Medidas corporais, fotos de evolução, gráficos e mapa muscular.
- Recomendações de treino e personal virtual.

## Persistência: como funciona de verdade

- **Supabase é a fonte principal**: treinos, histórico, medidas, agenda, fotos, metas e perfil ficam associados ao usuário autenticado no servidor e podem ser carregados em outros dispositivos mediante login.
- **localStorage é cópia complementar no navegador**: salva o último estado principal por usuário, sem fotos em base64. Ajuda a visualizar informações anteriores se a leitura do servidor falhar.
- Ao perder a conexão, a interface sinaliza quando está mostrando a cópia local e permite tentar reconectar. Se não houver cópia local e o Supabase falhar, o app informa o erro em vez de exibir uma conta aparentemente vazia.
- **A cópia local não equivale a sincronização offline**: lançamentos feitos sem rede não têm garantia de envio posterior; o usuário não deve presumir que estão sincronizados até serem confirmados pelo Supabase.
- O navegador pode apagar o localStorage quando os dados do site são limpos; a conta Supabase é o armazenamento durável para registros sincronizados.

## Estrutura técnica

- React 19, TypeScript e Vite
- Tailwind CSS, React Router, Recharts e Lucide
- Supabase Auth + tabelas PostgreSQL protegidas por RLS
- PWA instalável em navegadores compatíveis

O projeto **não** é um único arquivo HTML e **não** depende de um Artifact temporário para funcionar. O link de publicação é gerenciado pela hospedagem Vercel. Enviar um commit ao GitHub não comprova sozinho que a publicação terminou: verifique o deploy da Vercel.

## Desenvolvimento

```bash
npm ci
npm run dev
npm run build
```

Uma validação automática em GitHub Actions executa a compilação de produção a cada push na branch `main`.

## Roteiro de verificação após publicar

1. Abra o site e entre na conta.
2. Na tela **Conta**, confira **Dados cadastrais**, edite nome, idade, altura, sexo, nível, frequência e local de treino, salve e reabra a tela.
3. Acesse **Evolução**, escolha perder ou ganhar peso, ajuste a quantidade e o ritmo, confira semanas e data prevista e salve.
4. Recarregue a página e entre novamente: confira se as alterações continuam.
5. Teste em outro navegador/dispositivo usando a mesma conta para confirmar o carregamento de dados sincronizados via Supabase.
6. Verifique se os registros criados aparecem no banco (e não só na tela).

**Limitações pendentes:** testar a versão publicada em navegador real; confirmar o deploy da Vercel; implementar sincronização de alterações feitas totalmente offline, caso esse modo seja desejado.

## Agenda flexível (múltiplas opções no mesmo dia)

Abra **Meus treinos → Programação livre da semana** e toque em **Editar** no dia
que quiser. Você pode adicionar qualquer quantidade de treinos diferentes,
incluindo musculação, HYROX, core, e também corrida/cardio. Não existe ordem
obrigatória: escolha uma opção, duas ou todas, conforme energia, tempo e
recuperação. Cada atividade registrada é marcada independentemente na tela inicial.

O **Treinador IA** também pode propor dias com várias atividades. As propostas
mostram uma prévia e só são aplicadas depois de tocar em **Aplicar**.

Os programas prontos híbridos acrescentam opções combinadas na mesma data, sem
substituir automaticamente sua agenda até que você confirme a ativação.

## Biblioteca visual de exercícios (2026-10)

- O catálogo embutido passou de **210** para **327** exercícios, preservando todos
  os IDs antigos e os registros salvos.
- O seletor permite filtrar por músculos e especialidades como funcional/HYROX,
  calistenia/casa, mobilidade, antebraços, quadríceps, posteriores e panturrilhas.
- **Seletor, montador, programas prontos, sessão e detalhes** exibem miniaturas.
  O painel “Ver execução” mostra até duas fotografias estáticas do movimento.
- Apenas um subconjunto possui correspondência visual mapeada manualmente em
  `src/lib/exerciseMedia.ts`. O restante é identificado como sem demonstração
  revisada — não é permitida uma imagem de outra variante como substituta.
- Orientações individuais de execução são disponibilizadas quando revisadas;
  na ausência delas o app mostra nome, equipamento e região alvo, sem inventar
  passos técnicos específicos.
- O **personagem anatômico do próprio FitBox**, em visualização masculina ou
  feminina, pode ser aberto no guia para destacar a região predominante.
  Esse destaque **não** é medição precisa de ativação muscular.
- Fotos em duas posições não são vídeos ou animações nem substituem observação
  técnica presencial; links remotos exigem conexão e podem ficar indisponíveis.

**Direitos e atribuições:** as fotos vinculadas vieram de
[yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db),
que declara licença Unlicense para seu repositório. Parte da cadeia de
origem dos desenhos/fotos pode remeter à obra Everkinetic sob
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/);
mantemos identificação e origem por precaução. As dez pranchas enviadas
como referência estética não foram copiadas para o projeto público:
seus direitos e a correção biomecânica de cada miniatura não foram verificados.

## Imagens das estações HYROX (2026-10-27)

O catálogo agora mapeia explicitamente as **oito estações oficiais** do
HYROX e **cinco variações de treino** existentes (SkiErg intervalado,
remo intervalado, trenó técnico, burpee broad jump e farmer unilateral).
A cobertura visual dos 13 IDs é conferida em
`HYROX_EXPECTED_EXERCISES` (`src/lib/hyroxMedia.ts`).

**Importante:** "cobertura visual" não significa "13 fotografias".
O aplicativo distingue:

- **Fotografias exatas** de movimentos já existentes em
  `yuhonas/free-exercise-db` (sled push, remo, farmer carry bilateral,
  incluindo variantes de intervalo/técnica quando a execução é a mesma).
- **Ilustrações do SkiErg** em quadros da biblioteca
  `bryllim/workout-guide`, obra de Bryl Lim, imagens CC BY-SA 4.0.
- **Ilustrações vetoriais específicas** produzidas para o FitBox:
  puxada de trenó com corda, burpee com salto à frente, afundo com sandbag,
  arremesso de wall ball e farmer unilateral. São imagens esquemáticas
  de duas posições — não são fotos nem instrução biomecânica completa.

A UI preserva a separação entre imagem de **execução** e personagem
**anatômico**. Cada imagem tem origem explícita e texto indicando se é
fotografia ou ilustração. Não reutilizar fotos de variações diferentes como
se fossem a execução exata. Referência de movimentos oficiais:
[HYROX APAC](https://hyroxapac.zendesk.com/hc/en-us/articles/13979737446927-What-are-the-workouts-done-during-a-HYROX-race).

O protocolo de **esteira inclinada de 20 min** está listado como
**Programas prontos → Emagrecimento → Corrida / esteira**; a aba Cardio
continua responsável pelo **registro e histórico** dos treinos realizados.
