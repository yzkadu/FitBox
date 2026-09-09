# FitBox 💪

Personal trainer digital — uma plataforma pessoal de treinos inspirada na praticidade
de apps como o Hevy, com foco em ser rápida, mobile-first e 100% sua (todos os dados
ficam salvos localmente, no seu dispositivo).

## Funcionalidades

- **Perfis múltiplos**: cada pessoa que usa o app tem seus próprios dados isolados
  (treinos, histórico, medidas, cardio, agenda) no mesmo dispositivo.
- **Montar treinos**: crie treinos personalizados escolhendo exercícios de um catálogo
  com mais de 40 opções (ou crie os seus próprios), definindo séries e repetições alvo.
- **Treino híbrido e agenda semanal**: monte a programação da semana (treino de força,
  cardio ou descanso por dia) e veja o plano do dia automaticamente na tela inicial.
  Vem com um template pronto de 5 dias de força (Push/Pull/Legs/Upper/Lower) + cardio
  no fim de semana.
- **Treino do dia**: execute o treino registrando peso, repetições e marcando séries
  concluídas em tempo real, com cronômetro de duração.
- **Cardio**: registre corrida ou bike manualmente (duração, distância, pace calculado
  automaticamente, frequência cardíaca e esforço percebido).
- **Histórico**: veja todas as sessões concluídas, com detalhes de séries, volume total
  e recordes pessoais (PRs) por exercício.
- **Evolução**: gráficos de progressão de carga e volume por exercício, frequência
  semanal de treinos, peso corporal e medidas ao longo do tempo.
- **Medidas e fotos**: registre peso, percentual de gordura, medidas corporais (peito,
  cintura, quadril, braço, coxa, panturrilha) e fotos de evolução.
- **Personal Trainer virtual** (baseado em regras): acompanha seu histórico de cada
  exercício e sugere progressões de carga, identificando evolução ou estagnação.

## Stack técnica

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) como build tool
- [Tailwind CSS v4](https://tailwindcss.com/) para estilização
- [React Router](https://reactrouter.com/) para navegação
- [Recharts](https://recharts.org/) para os gráficos de evolução
- [Lucide](https://lucide.dev/) para ícones
- Persistência local via `localStorage` — sem backend necessário para rodar

O app é uma **PWA** (Progressive Web App): pode ser "instalado" na tela inicial do
celular e usado como um app nativo, direto do navegador.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador (idealmente no modo responsivo/mobile
do DevTools, já que o app é mobile-first).

Para gerar a build de produção:

```bash
npm run build
npm run preview
```

## Estrutura do projeto

```
src/
  components/   componentes de UI reutilizáveis (cards, botões, navegação, modais, perfis)
  hooks/        hooks React (acesso reativo ao estado global e aos perfis)
  lib/          lógica de negócio: storage (multi-perfil), ações (actions), estatísticas,
                catálogo de exercícios, personal trainer virtual, templates de programa
  pages/        as telas do app (Hoje, Treinos, Treino do dia, Cardio, Histórico,
                Evolução, Medidas)
  types/        tipos TypeScript do domínio (Workout, Session, Exercise, CardioLog,
                WeeklySchedule, Profile, etc.)
```

## Roadmap

- [ ] Personal Trainer virtual v2 com IA generativa
- [ ] Sincronização entre dispositivos (backend + autenticação)
- [ ] Exportar/importar dados (backup)
