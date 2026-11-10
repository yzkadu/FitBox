# Revisão do montador HYROX e pendências abertas — 10/11/2026

## Situação real

- [x] PR #23 incorporado ao `main`: circuito por voltas e estações, com CI aprovado.
- [x] Fichas convencionais preservadas e sem migração de banco; configuração guardada no JSON dos exercícios.
- [x] Inserção rápida de sequência por linhas `Nome do catálogo | meta` com bloqueio se um nome não existir.
- [ ] Teste manual completo em conta autenticada no celular, incluindo iniciar circuito, finalizar, recarregar, duplicar e trocar de aparelho.
- [x] PR #27 integrado: blocos mistos (aquecimento, força, técnica, circuito, desaquecimento); apenas o circuito é repetido.
- [x] PR #25 incorporado ao `main`: AMRAP com adição de volta, EMOM com indicador do minuto e For Time com relógio; resultado real em texto separado da meta.
- [x] PR #27 integrado: iniciar/pausar/retomar relógio neste dispositivo; EMOM destaca a estação e oferece aviso sonoro opt-in.
- [ ] Intervalos configuráveis de trabalho/descanso por estação, sincronização da pausa entre aparelhos e rodadas parciais com tempo medido.
- [x] Campo para registrar manualmente resultado real por estação, inclusive distância/tempo, separado da meta planejada; ainda não há sensor ou medição automática.
- [x] PR #28 nesta branch: inserção de estações nas voltas pendentes e reordenação de estações não concluídas, sem apagar séries registradas; não altera a ordem rígida do EMOM.
- [x] PR #28 nesta branch: escolhe exercício e meta da nova estação para a volta corrente e seguintes, ou só voltas futuras (exceto AMRAP).
- [x] PR #28 nesta branch: câmera/foto de referência no editor e transcrição **manual** supervisionada, sem upload ou OCR.
- [ ] Reconhecimento automático do texto da foto com permissão e revisão de privacidade.

## Revisão das PRs antigas

- **#13 — Remover Nutrição:** pedido diferente dos fluxos nutricionais ainda documentados e utilizados. Não fazer merge sem resolver a escolha de produto (remover interface, mas preservar dados), além da possível divergência de branch.
- **#8 — Uma imagem por exercício:** referência de cobertura antiga (238/327); reavaliar com o catálogo atual (330 IDs e novos atlas ilustrados), evitando reintroduzir imagens incorretas ou substituir recortes já aprovados.
- **#5 — pacote de 89 imagens:** aviso de binários pendentes é histórico; comparar os IDs e os atlas efetivamente presentes antes de reutilizar os scripts ou incluir duplicatas.

## Critérios de aceite para a próxima etapa

1. Criar circuito com 3 voltas e as estações SkiErg, sled push, remo e wall ball; a sessão deve seguir a ordem 1→2→3→4, repetida nas três voltas.
2. Concluir uma estação sem repetições numéricas quando a meta for tempo/distância, preservando o texto da meta e sem gerar uma medida fictícia.
3. Duplicar e reabrir a ficha sem perder modo, voltas, descanso, ordem ou notas.
4. Treinos tradicionais e históricos anteriores continuam intactos.
5. QA autenticado, build, lint e testes devem estar verdes antes de merge.

*Importante: registrar entrega em branch não equivale a implantação em produção.*

## QA da atualização #27–#28

- [x] Build e testes automatizados de #27 concluídos com sucesso; integração à branch principal.
- [ ] Verificar #28 com build, lint e testes antes de incorporar.
- [ ] Em conta autenticada: inserir uma estação na volta 2/3; conferir volta 1 intacta; reordenar duas estações ainda não concluídas; confirmar histórico e sincronização após atualização.
- [ ] Exercitar AMRAP + desaquecimento, EMOM com blocos mistos, Pausar/Retomar, troca de dispositivo e relógio após recarga.
- [ ] Testar câmera e permissões de arquivo no Safari iOS, Chrome Android e desktop; validar orientação/zoom e tamanho de arquivos.
- [ ] Inspecionar imagens e técnica dos 330 exercícios com revisão humana; testes estáticos não validam biomecânica.

A pausa do relógio é local no navegador e não está sincronizada entre dispositivos. A foto do quadro não é armazenada, enviada ou transcrita automaticamente.
