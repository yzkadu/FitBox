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
