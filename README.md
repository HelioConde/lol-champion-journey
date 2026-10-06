# LoL Champion Journey

Experiência visual que transforma o histórico recente de League of Legends em uma jornada pessoal por campeão.

## Objetivo do MVP

Responder rapidamente:
- qual campeão define o momento atual do jogador;
- quais campeões formam sua rotação recente;
- como frequência, KDA e maestria se combinam;
- o que é dado real e o que é apenas demonstração;
- como essa relação muda quando novas partidas entram na janela disponível.

O produto evita a aparência de tracker genérico. A hierarquia é cinematográfica, centrada em splash arts, narrativa curta, progressão e comparação visual.

## Estado atual

- repositório standalone ativo em `HelioConde/lol-champion-journey`;
- frontend standalone;
- PT-BR principal + EN;
- busca por Riot ID e servidor;
- integração com `public-lol-profile` do backend gamer ZeroTwo.gg;
- fallback demonstrativo explicitamente rotulado;
- deep link por Riot ID;
- buscas recentes persistidas localmente;
- campeão assinatura;
- seletor visual de campeões;
- índice de conexão derivado de frequência + KDA + maestria;
- timeline limitada à janela realmente disponível;
- slot estrutural para anúncios sem bloquear o fluxo;
- atualização automática via `version.json` / `live-update.js`;
- layout desktop e mobile.

## Regra de dados

O frontend não afirma possuir o histórico completo da conta. A Riot API usada no backend disponibiliza uma janela de dados; textos e indicadores são descritos como **amostra recente** quando esse é o limite da fonte.

## Backend

Reutiliza a infraestrutura gamer compartilhada:

`https://bieihhaobdztjyoweewa.supabase.co/functions/v1/public-lol-profile`

Nenhuma chave Riot fica no frontend.

## Próxima etapa

1. validar com Riot IDs reais;
2. ajustar correspondência de maestria por nome/ID no contrato do backend;
3. criar snapshots históricos próprios para permitir evolução real entre semanas/meses;
4. gerar card compartilhável PNG específico do campeão;
5. ativar GitHub Pages com GitHub Actions e validar o deploy público.

## Monetização

Preparado para anúncios, respeitando a regra global do portfólio: anúncios nunca bloqueiam busca, leitura ou análise principal.

## Idiomas

- PT-BR: principal/padrão;
- English: secundário obrigatório.
