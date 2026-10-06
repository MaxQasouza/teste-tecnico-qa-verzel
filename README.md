# Verzel Store: QA do card VZS-142 (Cupom de desconto e frete grátis)

Entrega do teste técnico de QA da Verzel: análise, execução e automação do card **VZS-142 (versão 2.3.0)**, que adiciona à Verzel Store o cupom de desconto `BEMVINDO10` e o frete grátis para compras a partir de R$ 200,00.

- Aplicação: https://verzel-store.qa-test-verzel-store.workers.dev
- Documentação do card: https://verzel-store.qa-test-verzel-store.workers.dev/documentacao

## Parecer

> ❌ **Não aprovado para produção.** Dois dos onze critérios de aceite estão reprovados (**CA06** e **CA10**) por bugs de severidade alta: um afeta o valor cobrado do cliente e o outro permite burlar uma regra de negócio.

| Bug | O que acontece | Severidade | Impacto |
|---|---|---|---|
| [BUG-001](docs/report-de-bugs.md#bug-001) | Com subtotal **exatamente R$ 200,00**, a loja cobra frete de R$ 19,90 e mostra "Faltam R$ 0,00 para o frete grátis". O CA06 diz "a partir de R$ 200,00, inclusive" | **Alta** | O cliente paga R$ 19,90 a mais justamente no valor da promoção. Bloqueia a entrega |
| [BUG-002](docs/report-de-bugs.md#bug-002) | A API aceita **mais de 5 unidades** por produto em `/carrinho/calcular` e `/pedidos`, e o pedido é confirmado. O CA10 exige a regra "na interface e na API" | **Alta** | O limite existe só no front e pode ser burlado pela API ou pelo `sessionStorage`. Bloqueia a entrega |
| [BUG-003](docs/report-de-bugs.md#bug-003) | Item sem `produtoId`/`quantidade` retorna `PRODUTO_NAO_ENCONTRADO` ("Produto undefined...") em vez de `ITEM_INVALIDO` | Baixa | Divergência de contrato, sem impacto financeiro |

Resumo da execução: **37 cenários** (33 Pass / 4 Fail) e **88 testes automatizados** (66 de API + 22 E2E). Detalhes em [execucao-testes.md](docs/execucao-testes.md).

## Checklist de entregáveis

| # | Entregável | Onde está | Status |
|---|---|---|---|
| 1 | Cenários de teste em BDD/Gherkin, rastreados aos critérios de aceite CA01–CA11 | [docs/cenarios-de-teste.md](docs/cenarios-de-teste.md) | ✅ |
| 2 | Execução dos testes, com resultado por cenário e matriz de rastreabilidade | [docs/execucao-testes.md](docs/execucao-testes.md) | ✅ |
| 3 | Report de bugs com severidade, passos, esperado × obtido e payloads | [docs/report-de-bugs.md](docs/report-de-bugs.md) | ✅ |
| 4 | Evidências (screenshots e logs de API) | [docs/evidencias/](docs/evidencias/) | ✅ |
| 5 | Automação com Playwright + TypeScript da jornada do usuário (E2E) e da API | [tests/e2e/](tests/e2e/) · [tests/api/](tests/api/) | ✅ |
| 6 | Coleção Postman de regras e contrato da API, executada com Newman | [postman/](postman/) | ✅ |
| 7 | Repositório executável: instruções, relatórios (Playwright, Newman e Allure) e CI | Este README · [.github/workflows/playwright.yml](.github/workflows/playwright.yml) | ✅ |

## Como executar

Pré-requisitos: **Node.js 20+**. Para o Allure Report, também **Java 8+** (o `allure-commandline` roda sobre Java).

```bash
npm ci
npx playwright install --with-deps chromium

npm test                  # suíte completa (API + E2E); testes de bugs abertos ficam como fixme
npm run test:bugs         # roda também os testes dos bugs, que falham de propósito e geram evidências
npm run test:api          # só API
npm run test:e2e          # só E2E
npm run typecheck         # checagem de tipos

npm run test:postman      # coleção Postman via Newman; asserções de bugs abertos ficam como skipped
npm run test:postman:bugs # Newman com exporBugs=true: as asserções dos bugs rodam e falham de propósito
```

### Relatórios

```bash
npm run report            # relatório HTML do Playwright (playwright-report/)

npm run allure:generate   # gera o Allure Report a partir de allure-results/
npm run allure:open       # abre o Allure Report no navegador
```

O Newman gera o relatório HTML (htmlextra) em `docs/evidencias/postman-report.html` (ou `postman-report-bugs.html` no modo de bugs).

Para rodar contra outro ambiente: `BASE_URL=https://... npm test`.

### Bugs conhecidos na suíte

Cada teste que reproduz um bug aberto tem a tag `@bug`, a anotação `bug` com o ID e `test.fixme(!EXPOR_BUGS, ...)`:

- **`npm test`**: os 10 testes de bugs ficam pulados, com o ID do bug como motivo. Resultado: 78 passed, 10 skipped, 0 failed.
- **`npm run test:bugs`** (`EXPOR_BUGS=1`): esses testes rodam e falham de forma controlada, com screenshot, vídeo e trace no relatório.
- Quando um bug for corrigido, basta remover o `test.fixme` do teste correspondente.

A coleção Postman segue o mesmo padrão: as requisições `[BUG-00X]` usam `bugTest`, que vira `pm.test.skip` a menos que a variável `exporBugs` seja `true`.

- **`npm run test:postman`**: 25 requisições, 136 asserções, 0 falhas (as 11 asserções de bugs ficam como skipped).
- **`npm run test:postman:bugs`** (`--env-var exporBugs=true`): as 11 asserções dos bugs rodam e falham (BUG-001: 3, BUG-002: 5, BUG-003: 3).
- No Postman (app), defina `exporBugs = true` nas variáveis da coleção para ver as falhas.

### CI (GitHub Actions)

O workflow [playwright.yml](.github/workflows/playwright.yml) roda em `push` e `pull_request` para `main` e também pode ser disparado manualmente. A sequência é: Node.js 20 → `npm ci` → typecheck → instalação do Chromium → `npm test` → `npm run test:postman` (roda mesmo se o Playwright falhar) → geração do Allure Report. Cada execução publica os artefatos `allure-report`, `allure-results`, `playwright-report`, `postman-report` e `evidencias` (screenshots, vídeos e traces).

## O que é testado

| Camada | Cobertura |
|---|---|
| **E2E** ([tests/e2e/](tests/e2e/)) | Adição ao carrinho pela vitrine · total com e sem `BEMVINDO10` · frete grátis a partir de R$ 200,00 · frete de R$ 19,90 com o valor faltante · frete calculado antes do desconto · um cupom por vez · limite de 5 unidades na vitrine e no carrinho · validação do checkout · pedido confirmado com dados válidos |
| **API: Postman/Newman** ([postman/](postman/)) | 25 requisições em 4 pastas (Produtos, Carrinho, Pedidos, Contrato e erros): schema e preços do catálogo · frete pago e frete grátis no limite · cupom válido, com espaços/minúsculas, expirado e inexistente · precedência do frete sobre o desconto · limite de 5 unidades · códigos de erro 400 / 404 / 422 |
| **API: Playwright** ([tests/api/](tests/api/)) | Contrato de produtos · cálculo de subtotal, desconto, frete e total com um oráculo independente · frete calculado antes do desconto · cupons válidos, expirados e inválidos · limite de 5 unidades · erros 400 / 404 / 405 / 422 |

## Estrutura

```text
├── .github/workflows/playwright.yml   # CI: Playwright + Newman + Allure + artefatos
├── docs/
│   ├── cenarios-de-teste.md           # BDD/Gherkin + mapeamento CA × cenários
│   ├── execucao-testes.md             # matriz de rastreabilidade e resultado
│   ├── report-de-bugs.md              # BUG-001, BUG-002, BUG-003
│   └── evidencias/                    # screenshots e logs de API dos bugs
├── postman/
│   └── Verzel_Store_API.postman_collection.json  # coleção exportada (variáveis incluídas)
├── tests/
│   ├── e2e/                           # jornada do usuário (Chromium)
│   ├── api/                           # contrato e regras de negócio
│   └── support/                       # fixtures, Page Objects, cliente da API, massa de dados
├── tools/coletar-evidencias.mjs       # regenera docs/evidencias (npm run evidencias)
├── playwright.config.ts
└── package.json
```

## Decisões de automação

- **Seletores acessíveis:** `getByRole` e `getByLabel` em vez de classes CSS. Os valores do resumo usam o atributo `data-valor` da aplicação, configurado como `testIdAttribute`.
- **Page Objects + fixtures:** os specs descrevem o comportamento, e os detalhes de DOM ficam em `tests/support/pages`.
- **Oráculo independente:** `resumoEsperado()` recalcula subtotal, desconto, frete, valor faltante e total pelas regras do card, em vez de copiar valores da resposta.
- **Pirâmide enxuta:** as variações de dados (formatos de cupom, e-mails, CEPs, limites) ficam na camada de API, que é mais rápida. A E2E cobre a jornada e um caso representativo de cada regra.
- **Determinismo:** cada teste roda em um contexto novo de navegador. Os setups focados pré-carregam o carrinho no `sessionStorage`, o mesmo mecanismo da aplicação. As ações que chamam a API aguardam a resposta antes de verificar a tela.
- **Rastreabilidade:** o título de cada teste começa com o ID do cenário (`CT-xx`) e cita o CA quando há um.

## Fora de escopo

Conforme a seção "Sobre este ambiente" da documentação, **não** foram reportados como bugs: carrinho restrito à aba, pedidos não persistidos e com número fictício, ausência de e-mail ou cobrança, preços fixos sem estoque e API stateless. Login, cadastro, pagamento online e consulta de pedidos também ficaram fora do escopo.

## Uso de IA

Usei assistentes de IA como **aceleradores técnicos**, sempre com revisão humana:

- **Onde ajudaram:** rascunho de cenários Gherkin a partir dos critérios de aceite, esqueleto de Page Objects e testes data-driven, revisão de texto da documentação e sugestões de casos de borda para a API.
- **O que fiz e validei:** a análise dos critérios de aceite, a escolha das técnicas de teste, a investigação e a confirmação de cada bug (reproduzidos manualmente e via API, com as evidências em `docs/evidencias/`), a classificação de severidade e o parecer final.
- **Critério para aceitar o que a IA produziu:** nenhum teste ou documento entrou sem ser lido, executado contra o ambiente real e ajustado. Testes frágeis ou redundantes foram descartados, e os valores esperados vêm das regras do card, nunca da resposta da aplicação.
