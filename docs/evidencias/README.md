# Evidências

Evidências dos bugs descritos em [report-de-bugs.md](../report-de-bugs.md). Os nomes dos arquivos começam pelo ID do bug (`BUG-001-*`, `BUG-002-*`, `BUG-003-*`). Arquivos `CONTROLE-*` mostram o comportamento correto, para comparação.

| Pasta | Conteúdo |
|---|---|
| [`screenshots/`](screenshots/) | Telas da interface no momento do defeito (Chromium, 1280×900, página inteira) |
| [`api-logs/`](api-logs/) | Request e response (método, URL, corpo, status, content-type e corpo da resposta) de cada reprodução via API, em JSON |

## Inventário

| Bug | Screenshots | Logs de API |
|---|---|---|
| BUG-001 | `BUG-001-carrinho-subtotal-200-cobra-frete.png`, `BUG-001-carrinho-subtotal-200-com-cupom.png`, `BUG-001-pedido-confirmado-com-frete.png` | `BUG-001-calcular-subtotal-200.json`, `BUG-001-calcular-subtotal-200-com-cupom.json`, `BUG-001-pedido-subtotal-200.json`, `BUG-001-controle-subtotal-219_80.json` |
| BUG-002 | `BUG-002-carrinho-6-unidades.png`, `BUG-002-pedido-confirmado-6-unidades.png`, `CONTROLE-vitrine-limite-5-unidades.png` | `BUG-002-calcular-quantidade-6.json`, `BUG-002-calcular-quantidade-100.json`, `BUG-002-pedido-quantidade-6.json` |
| BUG-003 | — (defeito só de API) | `BUG-003-item-sem-produtoId.json`, `BUG-003-item-sem-quantidade.json`, `BUG-003-controle-item-nao-objeto.json` |

## Como regenerar

```bash
npm run evidencias                                   # contra o ambiente publicado
BASE_URL=https://outro-ambiente npm run evidencias   # contra outro ambiente
```

O script fica em [`tools/coletar-evidencias.mjs`](../../tools/coletar-evidencias.mjs).

Evidências adicionais (screenshot, vídeo e trace de cada teste que falha) são geradas ao rodar `npm run test:bugs`. Elas ficam em `test-results/`, no relatório HTML (`npm run report`) e no Allure Report. No CI são publicadas como artefatos do workflow.
