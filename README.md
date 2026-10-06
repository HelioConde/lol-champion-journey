# LoL Champion Journey

Experiência visual que transforma a amostra recente de League of Legends em uma jornada pessoal por campeão, com comparação, evolução entre consultas e compartilhamento.

## Produto

O Champion Journey responde:

- qual campeão define o momento atual;
- como o pool recente está distribuído;
- como presença, desempenho, maestria e consistência formam o Connection Index;
- quais campeões estão subindo ou saindo da amostra;
- como a relação com um campeão muda entre snapshots;
- quais dados são Riot reais e quais são demonstração.

A interface é LoL-first e cinematográfica, evitando aparência de tracker genérico.

## Estado atual

- repositório standalone ativo;
- GitHub Pages ativo;
- PT-BR principal + EN;
- busca por Riot ID + servidor;
- `public-lol-profile` do backend gamer ZeroTwo;
- consulta de até 100 partidas;
- Data Dragon para nomes/IDs/assets;
- maestria real casada por `championId`;
- fallback demo claramente identificado;
- erros específicos para rate limit e Riot ID inexistente;
- deep links e idioma via URL;
- buscas recentes locais;
- splash arts com lazy loading;
- campeão assinatura e pool recente;
- Connection Index explicável: presença + desempenho (KDA/win rate) + maestria + consistência;
- comparação entre campeões;
- métricas de win rate, dano/min, CS/min, melhor KDA, streak e contextos quando disponíveis;
- timeline de partidas reais do campeão;
- snapshots locais (24);
- comparação entre snapshots;
- sinais de main recente mudando, campeão em ascensão e saída da amostra;
- gráfico histórico alternável entre conexão, KDA, maestria e partidas;
- card PNG 1200×630 com splash, Riot ID, período e score;
- compartilhamento nativo + copiar link;
- PWA com service worker, manifest e ícones;
- atualização automática por `version.json`;
- SEO: canonical, hreflang, Open Graph, Twitter metadata, sitemap e robots;
- política de privacidade bilíngue;
- três slots estruturais de anúncio com espaço reservado;
- observabilidade local e endpoint opcional;
- QA estática;
- Playwright em Chromium, Firefox, WebKit, Pixel e iPhone;
- smoke test real com `AlchemyFlames#BR1`.

## Dados e interpretação

A Riot API entrega uma janela consultável, não a história completa da conta. O produto usa termos como **amostra recente** quando esse é o limite da fonte.

Evolução histórica só é apresentada como tal quando existem snapshots capturados em momentos diferentes.

## Connection Index

Pesos atuais:

- 40% presença relativa;
- 25% desempenho (KDA + win rate quando disponível);
- 20% maestria relativa;
- 15% consistência de KDA nas partidas do campeão.

A fórmula é exibida na interface para evitar uma nota opaca.

## Backend

Perfil Riot:

`https://bieihhaobdztjyoweewa.supabase.co/functions/v1/public-lol-profile`

Nenhuma chave Riot ou service role fica no frontend.

### Snapshots server-side

O repositório já contém:

- `supabase/schema/champion-journey-snapshots.sql`;
- `supabase/functions/_shared/champion-journey-snapshots.ts`;
- `supabase/functions/champion-journey-history/index.ts`.

A escrita foi projetada para ser server-authoritative. O navegador não pode gravar snapshots oficiais.

A ativação deve ocorrer exclusivamente no Supabase gamer do ZeroTwo. O Supabase atualmente conectado nesta sessão expõe apenas `pizzaria-db`, portanto o deploy no banco gamer não foi feito daqui.

## Publicação

GitHub Pages:

`https://helioconde.github.io/lol-champion-journey/`

Cada push na `main` publica automaticamente.

## Monetização

Preparado para anúncios sem bloquear busca, análise, atualização ou compartilhamento. Anúncios reais continuam desativados até configuração de publisher/consentimento.

## Compliance

O site contém aviso legal Riot completo e política de privacidade.

## Próximas dependências reais

1. aplicar o schema de snapshots no Supabase gamer;
2. integrar a persistência server-side ao `public-lol-profile`;
3. ativar `champion-journey-history` e configurar `snapshotHistory`;
4. testar mais Riot IDs reais/regiões além de `AlchemyFlames#BR1`;
5. adicionar ícones PNG 192/512 se uma plataforma específica exigir;
6. conectar observabilidade remota quando houver endpoint definido;
7. configurar anúncios reais somente após aprovação/políticas.

## Idiomas

- PT-BR: principal/padrão;
- English: secundário.