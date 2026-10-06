# Integração Riot — LoL Champion Journey

Revisado em 06/10/2026.

## Infraestrutura

O produto reutiliza o backend gamer compartilhado do ZeroTwo.gg.

- Supabase gamer: `bieihhaobdztjyoweewa`;
- Edge Function pública consumida: `public-lol-profile`;
- Riot API key fica exclusivamente no backend;
- cache de jogador e partidas reduz chamadas repetidas;
- o frontend não contém chave Riot ou service role.

**Não usar `pizzaria-db` para este produto.**

## Contrato atual

Entrada principal:

```json
{
  "gameName": "AlchemyFlames",
  "tagLine": "BR1",
  "platform": "br1",
  "region": "americas",
  "limit": 100,
  "matchLimit": 100,
  "historyDepth": 100
}
```

Saída utilizada pelo Champion Journey:

- `player`;
- `summary`;
- `championSummaries`;
- `mastery`;
- `matches`;
- `ranked`;
- `modeSummaries`.

A maestria real usa `championId`. O frontend resolve ID/nome/assets pelo catálogo oficial do Data Dragon.

## Identidade

A busca usa Riot ID:

- Game Name;
- Tag Line;
- plataforma/servidor.

O backend resolve Riot ID → PUUID via ACCOUNT-V1.

## Endpoints Riot relevantes

- ACCOUNT-V1;
- SUMMONER-V4;
- CHAMPION-MASTERY-V4;
- LEAGUE-V4;
- MATCH-V5.

## Limites de interpretação

A resposta da Riot representa uma janela recente consultável, não o histórico completo da conta. O produto só chama algo de evolução histórica quando há snapshots próprios capturados em consultas diferentes.

## Segurança

- nenhuma chave Riot no navegador;
- nenhum service role no frontend;
- HTTPS;
- cache e tratamento de rate limit;
- dados demo nunca são persistidos como histórico real.

## Compliance

LoL Champion Journey não é endossado pela Riot Games e não reflete as opiniões ou visões da Riot Games ou de qualquer pessoa oficialmente envolvida na produção ou gerenciamento das propriedades da Riot Games. Riot Games e todas as propriedades associadas são marcas comerciais ou marcas registradas da Riot Games, Inc.

O produto é pós-jogo/histórico e não oferece vantagem competitiva em tempo real.
