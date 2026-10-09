# LoL Champion Journey 1.0 — encerramento técnico

**Data de revisão:** 09/10/2026  
**Status:** MVP técnico com busca Riot real, histórico durável entre dispositivos e QA automatizado. **Liberação pública/monetização condicionadas às aprovações e credenciais Riot pertinentes**. Testes finais com outras regiões e dispositivos reais continuam pendentes.

## Produto e experiência

- [x] Busca por Riot ID + servidor; modos Ranked, Normal, ARAM e Arena quando presentes na amostra.
- [x] Amostragem adaptativa 30 → 20 → 12 partidas recentes (não afirmar que cobre toda a história da conta).
- [x] Champion Index explicável, maestria e dados de partidas reais, timeline, comparação de campeões, histórico local, card PNG 1200×630 e links compartilháveis.
- [x] PT-BR principal, inglês secundário; mobile/desktop, SEO, páginas legais e estrutura de anúncios desligada.
- [x] PWA instalado e cache limitado à própria pasta/app shell: não guarda URLs personalizadas com Riot IDs nem apaga caches de outras aplicações do domínio.
- [x] Live Update verifica somente o worker e os caches do LoL Champion Journey.
- [x] Novos testes de regressão PWA para isolamento de cache, dados privados e shell offline.

## Backend ZeroTwo — implementado e verificado

**Banco gamer:** `bieihhaobdztjyoweewa` (não usar `pizzaria-db`).

- [x] Supabase gamer confirmado `ACTIVE_HEALTHY`.
- [x] Tabela `public.lol_champion_journey_snapshots` criada via migration `champion_journey_snapshots_server_authoritative`.
- [x] Migration `grant_champion_journey_snapshot_service_role_only`: `service_role` autorizado a SELECT/INSERT; `anon` e `authenticated` sem leitura/gravação direta.
- [x] RLS habilitada. Alerta `INFO: rls_enabled_no_policy` esperado: o browser nunca deve consultar a tabela, e a leitura pública usa exclusivamente a Edge Function.
- [x] `champion-journey-history` publicada, CORS/preflight compatível com frontend público.
- [x] `public-lol-profile` atualizada para armazenar somente dados derivados de partidas Riot reais, com opt-out `CHAMPION_JOURNEY_SNAPSHOTS_ENABLED=false` se necessário.
- [x] Deduplicação corrigida: JSONB reordena propriedades e não pode ser comparado via `JSON.stringify` sem normalizar. Persiste somente novas amostras distintas.
- [x] O endpoint de histórico oculta duplicatas legadas consecutivas, sem apagar dados existentes.
- [x] Teste remoto end-to-end [Live Riot Smoke](https://github.com/HelioConde/lol-champion-journey/actions/runs/37948224519) aprovado em 09/10: `AlchemyFlames#BR1`, 30 partidas, leitura HTTP 200, histórico 1 snapshot distinto; consulta repetida manteve 1 snapshot.
- [x] SQL no banco confirmou a tabela, grants, RLS e registros oficiais do mesmo Riot ID.

**Nota operacional:** algumas consultas antes da correção criaram quatro capturas idênticas em armazenamento. O endpoint já retorna apenas uma captura distinta; os registros físicos foram preservados. Pode-se definir retenção/limpeza futura, sem apagar dados arbitrariamente.

## CI e UI

- [x] [GitHub Pages após as correções funcionais](https://github.com/HelioConde/lol-champion-journey/actions/runs/37948315077) aprovado.
- [x] [Static QA](https://github.com/HelioConde/lol-champion-journey/actions/runs/37948315307) aprovado.
- [x] [Live Update QA](https://github.com/HelioConde/lol-champion-journey/actions/runs/37948315119) aprovado.
- [x] [Live Riot Smoke + repetição/idempotência](https://github.com/HelioConde/lol-champion-journey/actions/runs/37948224519) aprovado.
- [x] [Browser E2E após correção do regex PWA](https://github.com/HelioConde/lol-champion-journey/actions/runs/37948315266) — **69 passed, 3 skipped** (PWA dedicado ao Chromium).
- [x] [Lighthouse da revisão](https://github.com/HelioConde/lol-champion-journey/actions/runs/37948315359) aprovado.
- [x] [Capturas visuais de desktop e mobile](https://github.com/HelioConde/lol-champion-journey/actions/runs/37948358490) aprovadas após o deploy.

## Gates humanos e externos

- [ ] Registrar / verificar a aplicação conforme as políticas aplicáveis do Riot Developer Portal e credenciais adequadas antes de acesso público amplo; evitar chaves temporárias/compartilhadas sem autorização.
- [ ] Validar Riot IDs reais em NA, EUW/EUNE, KR/JP, sem partidas e prioritariamente ARAM/Arena.
- [ ] Verificar o histórico remoto em dois navegadores/dispositivos e em uma segunda sessão real.
- [ ] Validar limites e expiração da chave Riot, 429, dados ausentes e comportamento em instabilidade regional.
- [ ] Revisar consentimento/AdSense/monetização após aprovação; anúncios seguem desativados.
- [ ] Validar card PNG e layout em dispositivos físicos.
- [ ] Revisar RLS e retenção do snapshot periodicamente (não expor PUUID desnecessariamente).

## Regra de manutenção

Não iniciar funcionalidades novas até estes gates. Priorizar apenas P0/P1, integridade dos dados, conformidade e problemas confirmados por usuários.

Site: https://helioconde.github.io/lol-champion-journey/  
Repo: https://github.com/HelioConde/lol-champion-journey  
Issues: https://github.com/HelioConde/lol-champion-journey/issues/4
