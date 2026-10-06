# Snapshot Contract — LoL Champion Journey

Formato preparado para persistência futura no backend gamer compartilhado.

## Objetivo

Preservar a evolução de um Riot ID ao longo do tempo sem depender da janela limitada da Riot API.

O frontend já usa este formato localmente. A futura sincronização com Supabase deve manter o mesmo shape para evitar retrabalho na UI.

## Identidade lógica

Um histórico pertence à combinação:

- `game_name`
- `tag_line`
- `platform`

O navegador não precisa conhecer ou persistir PUUID.

## Snapshot

```json
{
  "capturedAt": 1791288000000,
  "sampleMatches": 12,
  "signature": "Lux",
  "champions": [
    {
      "name": "Lux",
      "games": 6,
      "avgKda": 4.1,
      "masteryPoints": 999999,
      "masteryLevel": 7
    }
  ]
}
```

## Regras

- salvar apenas quando a amostra derivada mudou;
- nunca inventar partidas históricas;
- `capturedAt` representa a captura do snapshot, não a data das partidas;
- reter no mínimo snapshots suficientes para comparação semanal/mensal;
- frontend atual retém os 24 snapshots mais recentes localmente;
- dados demo nunca viram snapshot histórico;
- dados brutos da Riot não precisam ser armazenados quando o resumo derivado for suficiente.

## Persistência futura sugerida

Tabela sugerida: `lol_champion_journey_snapshots`

Campos mínimos:

- `id uuid`
- `profile_key text`
- `game_name text`
- `tag_line text`
- `platform text`
- `captured_at timestamptz`
- `sample_matches integer`
- `signature text`
- `champions jsonb`
- `created_at timestamptz`

Índice recomendado:

`(profile_key, captured_at desc)`

O endpoint futuro pode responder apenas os snapshots derivados necessários para comparação, evitando expor payloads brutos da Riot.
