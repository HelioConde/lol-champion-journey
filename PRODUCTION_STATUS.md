# Production Status

Última revisão: 06/10/2026

## Implementado

- [x] limpeza de referências Riot Legacy;
- [x] busca Riot real e smoke test com AlchemyFlames#BR1;
- [x] Data Dragon para campeão/asset e maestria por championId;
- [x] mensagens específicas para rate limit, backend e Riot ID inexistente;
- [x] até 100 partidas por consulta de produção;
- [x] snapshots locais com deduplicação;
- [x] comparação entre snapshots;
- [x] gráfico histórico de conexão, KDA, maestria e partidas;
- [x] sinais de main mudando, campeão em ascensão e saída da amostra;
- [x] análise profunda por campeão;
- [x] comparação entre campeões;
- [x] Connection Index explicável com presença, desempenho, maestria e consistência;
- [x] timeline por partidas reais quando disponíveis;
- [x] card PNG com splash, Riot ID, período, métricas e score;
- [x] Web Share API + copiar link;
- [x] canonical, hreflang, Open Graph, Twitter metadata, robots e sitemap;
- [x] favicon e manifest;
- [x] service worker e offline básico;
- [x] política de privacidade PT-BR/EN;
- [x] aviso legal Riot;
- [x] três slots reservados para anúncios sem bloquear a UX;
- [x] observabilidade local e endpoint remoto opcional;
- [x] lazy loading de splash arts nos cards;
- [x] QA estática;
- [x] Playwright multi-browser e mobile;
- [x] live update;
- [x] GitHub Pages.

## Preparado no GitHub, aguardando infraestrutura externa

- [ ] aplicar `supabase/schema/champion-journey-snapshots.sql` no Supabase gamer;
- [ ] ligar o helper server-authoritative ao `public-lol-profile`;
- [ ] deploy da Edge Function `champion-journey-history`;
- [ ] definir `snapshotHistory` no backend-config após o deploy;
- [ ] definir endpoint remoto de observabilidade, se desejado;
- [ ] configurar publisher/slots reais e consentimento para anúncios;
- [ ] adicionar PNGs 192/512 caso a plataforma de instalação exija.

## Validação real ainda desejada

- [ ] testar Riot IDs reais em NA;
- [ ] testar Riot IDs reais em EUW/EUNE;
- [ ] testar Riot IDs reais em KR/JP;
- [ ] testar conta com poucas partidas;
- [ ] testar conta focada em ARAM/Arena;
- [ ] revisar Lighthouse em produção após estabilizar o bundle.

## Regra de conclusão

O MVP de frontend pode ser considerado funcional e publicado. A pendência estrutural mais importante para a próxima fase é a persistência server-side de snapshots no banco gamer, pois ela transforma a evolução local em histórico durável entre dispositivos.