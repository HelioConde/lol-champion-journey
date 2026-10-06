# Estratégia de integração Riot

Revisado em 06/10/2026 com base no Riot Developer Portal.

## Infraestrutura gamer já disponível

O Riot Legacy reutiliza o Supabase gamer do ZeroTwo.gg:

- ref `bieihhaobdztjyoweewa`;
- `RIOT_API_KEY` já configurada como secret de Edge Function;
- `public-lol-profile` já implementa Riot ID → PUUID → Summoner/Ranked/Mastery/Match-V5;
- `riot_player_cache` e `lol_match_cache` já reduzem chamadas repetidas;
- o frontend usa apenas credenciais públicas do Supabase.

**Não criar banco gamer paralelo e não usar o `pizzaria-db`.**

## Identidade

A interface deve pedir **Riot ID**:
- Game Name;
- Tag Line.

Não construir busca principal baseada em Summoner Name legado.

O primeiro passo do backend será ACCOUNT-V1 para resolver Riot ID em PUUID.

## PUUID

Quando os endpoints suportarem PUUID, preferir PUUID como identificador técnico.

## Endpoints candidatos

### Conta
- ACCOUNT-V1

### League of Legends
- SUMMONER-V4
- CHAMPION-MASTERY-V4
- LEAGUE-V4
- MATCH-V5
- LOL-CHALLENGES-V1

### TFT
- TFT-MATCH-V1
- TFT-LEAGUE-V1
- demais endpoints suportados e necessários quando a integração for implementada.

## Segurança

- API key nunca no navegador.
- Backend/Edge Function faz chamadas à Riot.
- HTTPS obrigatório.
- Production key própria para Riot Legacy.
- Rate limiting + cache.
- Não registrar a API key em logs.

## Produto

Riot Legacy não criará:
- MMR/ELO alternativo;
- vantagem em tempo real;
- recomendações que removam decisões do jogo;
- de-anonimização de jogadores.

O foco é histórico, identidade, retrospectiva e compartilhamento pós-jogo.

## Registro

Antes do uso público de dados reais, registrar o produto no Riot Developer Portal e manter descrição/features atualizadas conforme as políticas vigentes.


## Consumo atual no Riot Legacy

O frontend já consome:

- `public-lol-profile`;
- `public-tft-profile`.

A seleção passou a ser por servidor/plataforma (`br1`, `na1`, `euw1`, etc.) e o frontend deriva o routing regional necessário ao LoL.

Dados utilizados no MVP atual:

### LoL
- perfil básico;
- ranked;
- maior maestria retornada;
- campeões mais frequentes na amostra;
- funções;
- win rate recente;
- partidas recentes.

### TFT
- colocação média;
- Top 4 rate;
- distribuição de colocações;
- units da partida mais recente;
- traits ativos da partida mais recente.

A interface não chama esses recortes de “histórico completo”. Eles são apresentados como amostra recente até existirem snapshots históricos suficientes.


## Resiliência do frontend

As duas consultas públicas rodam em paralelo e possuem timeout de 14 segundos. A interface descarta respostas atrasadas de uma busca anterior.

Quando apenas LoL ou TFT responde, a outra seção permanece em fallback demonstrativo identificado.

O usuário pode repetir a consulta com **Atualizar dados** sem recarregar a página, o que também cobre rate limit temporário e falhas transitórias.
