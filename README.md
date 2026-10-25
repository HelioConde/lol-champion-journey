<div align="center">
  <h1>🏆 LoL Champion Journey</h1>
  <p><strong>A história dos seus campeões favoritos contada pelo seu histórico recente de League of Legends.</strong></p>
  <p><img alt="Riot API via backend" src="https://img.shields.io/badge/Riot%20API-via%20backend-334155"> <img alt="Status" src="https://img.shields.io/badge/status-MVP%20em%20evolu%C3%A7%C3%A3o-64748b"></p>
  <p><a href="https://helioconde.github.io/lol-champion-journey/"><strong>Abrir a experiência</strong></a> · <a href="RELEASE_V1.md"><strong>Relatório</strong></a> · <a href="SNAPSHOT_CONTRACT.md"><strong>Dados e snapshots</strong></a></p>
</div>

## Sobre

O **Champion Journey** transforma o histórico recente de partidas em um retrato pessoal dos campeões que você mais utiliza. O foco não é montar uma tier list, mas responder: **quem define meu estilo de jogo neste momento? Como isso mudou?**

## A experiência

1. Informe seu **Riot ID** e selecione o servidor.
2. Confira o campeão assinatura e a distribuição do pool recente.
3. Veja presença, KDA, resultados e maestria disponível.
4. Compare consultas salvas (*snapshots*) para identificar mudanças.
5. Explore detalhes e compartilhe os resultados disponíveis.

| Recurso | O que significa |
| --- | --- |
| **Campeão assinatura** | Destaque calculado a partir da amostra recente |
| **Champion Pool** | Distribuição de campeões utilizados |
| **Connection Index** | Indicador pessoal explicável, baseado em critérios documentados |
| **Evolução** | Comparação entre consultas/snapshots |
| **Dados reais** | Consultas ao `public-lol-profile` via backend |
| **Fallback** | Demonstração identificada quando os dados reais não estão disponíveis |

**Limitação essencial:** a consulta adaptativa tenta amostras de **30, 20 ou 12 partidas**, conforme a disponibilidade. O resultado não representa todas as partidas da conta e não prevê desempenho futuro.

## Rodar localmente

```bash
git clone https://github.com/HelioConde/lol-champion-journey.git
cd lol-champion-journey
npm install
npm run dev
```

O servidor estático usa normalmente `http://localhost:4173`. Para checagens:

```bash
npm run check
npm run test:e2e
```

A API Riot é acessada pelo backend configurado. **A chave Riot não deve ser incluída no código público.** A disponibilidade de dados reais depende das permissões e dos limites do serviço.

## Documentação e próximos passos

[Estado de produção](PRODUCTION_STATUS.md) · [Contrato de snapshots](SNAPSHOT_CONTRACT.md) · [API Riot](RIOT_API.md) · [Relatório técnico](RELEASE_V1.md)

**Estado:** interface e consulta documentadas; lançamento amplo e monetização dependem dos requisitos e permissões Riot e de validação com usuários reais.

Projeto independente, não oficial, sem afiliação à Riot Games. Desenvolvido por [Hélio Conde](https://github.com/HelioConde).
