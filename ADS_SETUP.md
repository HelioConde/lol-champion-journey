# Ads — Riot Legacy

## Regra

Riot Legacy seguirá a regra do portfólio: produto gratuito com monetização principal por anúncios.

## Estado atual

**Anúncios reais desativados.**

O layout possui espaços reservados apenas para validar composição e evitar layout shift futuro.

## Pré-requisitos antes de ativar

1. Riot Legacy registrado no Riot Developer Portal.
2. Status do produto compatível com monetização pelas políticas vigentes.
3. Publisher ID e slots reais da rede de anúncios.
4. Política de privacidade/consentimento quando aplicável.
5. Teste mobile/desktop sem sobrepor controles.
6. Não posicionar anúncios dentro de propriedades Riot (jogo/cliente/loading screens).
7. Não incentivar clique acidental.

## Slots planejados

- `legacy-top`: depois da primeira leitura de valor, nunca antes do formulário principal;
- `legacy-profile-mid`: entre blocos de história no perfil;
- `legacy-share-end`: após a área de compartilhamento.

Os slots usam espaço reservado com altura mínima para prevenir CLS.

## Implementação futura

Configurar por arquivo separado/variáveis públicas de Publisher e slot IDs. Não commitar chaves privadas nem inventar IDs de produção.
