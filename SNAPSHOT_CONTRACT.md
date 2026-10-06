# Snapshot Contract — LoL Champion Journey

## Objetivo

Preservar a evolução de um Riot ID ao longo do tempo sem tratar a janela da Riot API como histórico completo.

## Arquitetura

- o frontend mantém até 24 snapshots locais para resposta imediata;
- snapshots de demonstração nunca são persistidos;
- a persistência central deve ser **server-authoritative**;
- o navegador não envia snapshots para serem aceitos como verdade;
- o backend gamer gera snapshots a partir de respostas oficiais da Riot;
- `champion-journey-history` é apenas leitura e pode sincronizar o histórico entre dispositivos.

## Identidade lógica

`profile_key = platform:game_name#tag_line`, normalizado para minúsculas.

Exemplo:

`br1:alchemyflames#br1`

## Snapshot

```json
{
  "capturedAt": 1791288000000,
  "sampleMatches": 12,
  "signature": "Senna",
  "champions": [
    {
      "name": "Senna",
      "games": 2,
      "avgKda": 3.4,
      "masteryPoints": 120000,
      "masteryLevel": 7
    }
  ],
  "sourceVersion": "public-lol-profile-v1"
}
```

## Regras

- persistir apenas dados derivados de resposta Riot válida;
- nunca persistir fallback demo;
- `capturedAt` é a data da captura, não da partida;
- deduplicar capturas equivalentes no backend;
- reter dados suficientes para comparações semanais/mensais;
- não expor PUUID ao frontend quando não for necessário;
- tabela não deve conceder acesso direto a `anon` ou `authenticated`.

## Arquivos

- `supabase/schema/champion-journey-snapshots.sql`;
- `supabase/functions/_shared/champion-journey-snapshots.ts`;
- `supabase/functions/champion-journey-history/index.ts`.

A ativação deve ocorrer somente no Supabase gamer compartilhado do ZeroTwo.
