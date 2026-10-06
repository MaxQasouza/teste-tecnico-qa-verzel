# Execução de testes: VZS-142, Cupom de desconto e frete grátis

| Item | Valor |
|---|---|
| Versão testada | 2.3.0 |
| Ambiente | https://verzel-store.qa-test-verzel-store.workers.dev |
| Data | 06/10/2026 |
| Ferramentas | Playwright 1.63 (Chromium) · TypeScript · Allure Report · Node.js 20+ |
| Cenários | [cenarios-de-teste.md](cenarios-de-teste.md) |
| Bugs | [report-de-bugs.md](report-de-bugs.md) |

## Resultado consolidado

| Métrica | Valor |
|---|---|
| Cenários especificados | 37 (CT-01 a CT-37) |
| Cenários **Pass** | 33 |
| Cenários **Fail** | 4: CT-02, CT-19, CT-20 e CT-34 |
| Critérios de aceite atendidos | 9 de 11. **CA06** e **CA10** reprovados |
| Bugs abertos | 3: BUG-001 e BUG-002 (severidade alta), BUG-003 (severidade baixa) |
| Testes automatizados | 88 (66 de API + 22 E2E) |
| Resultado de `npm test` | 78 passed · 10 skipped (`fixme`, ligados aos 3 bugs) · 0 failed · ~15 s |
| Resultado de `npm run test:bugs` | 78 passed · **10 failed**: exatamente os testes dos bugs |
| Estabilidade | 3 execuções completas consecutivas sem falha nem flaky |

**Parecer:** o card VZS-142 **não está pronto para produção**. Há dois defeitos de severidade alta em regras centrais da entrega: o frete no limite de R$ 200,00 (BUG-001) e o limite de 5 unidades na API (BUG-002). Cupons (CA01–CA05), precedência e arredondamento (CA08, CA09, CA11) e as validações da loja funcionam conforme especificado.

## Matriz de rastreabilidade

Tipo de teste: **E2E** (interface, Playwright + Chromium), **API** (contrato e regras via `request` do Playwright) ou **Manual**. A coluna "Testes" traz quantos testes automatizados cobrem o cenário; o título de cada teste começa com o ID do cenário.

| ID | Cenário | CA | Tipo de teste | Testes | Resultado | Bug |
|---|---|---|---|---|---|---|
| CT-01 | Frete grátis com subtotal acima de R$ 200,00 | CA06 | E2E + API | 2 | ✅ Pass | |
| CT-02 | Frete grátis com subtotal **exatamente** R$ 200,00 | CA06 | E2E + API | 3 | ❌ Fail | [BUG-001](report-de-bugs.md#bug-001) |
| CT-03 | Frete de R$ 19,90 e aviso do valor faltante (R$ 189,90 → faltam R$ 10,10) | CA07 | E2E + API | 2 | ✅ Pass | |
| CT-04 | Valores limite do frete (189,90 / 199,80 / 219,80) | CA06, CA07 | E2E + API | 2 | ✅ Pass | |
| CT-05 | Frete muda ao cruzar o limite com +/− | CA06, CA07 | E2E | 1 | ✅ Pass | |
| CT-06 | `BEMVINDO10` aplica 10% sobre o subtotal | CA01, CA11 | E2E + API | 2 | ✅ Pass | |
| CT-07 | Cupom sem distinção de maiúsculas/minúsculas e com espaços nas pontas | CA02 | E2E + API | 7 | ✅ Pass | |
| CT-08 | Cupom inexistente → "Cupom inválido." | CA03 | E2E + API | 3 | ✅ Pass | |
| CT-09 | Cupom expirado → "Cupom expirado." | CA04 | E2E + API | 3 | ✅ Pass | |
| CT-10 | Cupom em branco → "Informe um cupom." | — | E2E + API | 2 | ✅ Pass | |
| CT-11 | Um cupom por vez: remover e aplicar outro | CA05 | E2E | 1 | ✅ Pass | |
| CT-12 | Pedido com cupom inválido/expirado → 422 | CA03, CA04 | E2E + API | 3 | ✅ Pass | |
| CT-13 | Frete grátis avaliado antes do desconto (219,80 → 197,82) | CA08 | E2E + API | 2 | ✅ Pass | |
| CT-14 | Desconto não incide sobre o frete | CA09 | E2E + API | 2 | ✅ Pass | |
| CT-15 | R$ 199,80 com cupom continua pagando frete | CA07, CA08 | API | 1 | ✅ Pass | |
| CT-16 | Arredondamento em 2 casas decimais | CA11 | API | 3 | ✅ Pass | |
| CT-17 | Vitrine bloqueia a 6ª unidade de um produto | CA10 | E2E | 1 | ✅ Pass | |
| CT-18 | Carrinho desabilita "+" em 5 e "−" em 1 unidade | CA10 | E2E | 1 | ✅ Pass | |
| CT-19 | API de cálculo recusa quantidade > 5 | CA10 | API | 2 | ❌ Fail | [BUG-002](report-de-bugs.md#bug-002) |
| CT-20 | Pedido com 6 unidades é recusado (API e interface burlada) | CA10 | E2E + API | 2 | ❌ Fail | [BUG-002](report-de-bugs.md#bug-002) |
| CT-21 | Quantidade inválida (0, −1, 1.5, "2") → 422 | — | API | 4 | ✅ Pass | |
| CT-22 | Quantidade igual ao limite (5) é aceita | CA10 | API | 1 | ✅ Pass | |
| CT-23 | Campos obrigatórios do checkout em branco | — | E2E | 1 | ✅ Pass | |
| CT-24 | Nome sem sobrenome | — | E2E + API | 4 | ✅ Pass | |
| CT-25 | E-mail em formato inválido | — | E2E + API | 5 | ✅ Pass | |
| CT-26 | CEP fora do formato de 8 dígitos | — | E2E + API | 6 | ✅ Pass | |
| CT-27 | Submissão com dados válidos (CEP com e sem hífen) | — | E2E + API | 2 | ✅ Pass | |
| CT-28 | `DADOS_INVALIDOS` lista todos os campos do cliente | — | API | 1 | ✅ Pass | |
| CT-29 | Contrato de `GET /api/produtos` e `/api/produtos/{id}` | — | API | 2 | ✅ Pass | |
| CT-30 | Produto inexistente → 404 | — | API | 2 | ✅ Pass | |
| CT-31 | Corpo que não é objeto JSON → 400 | — | API | 2 | ✅ Pass | |
| CT-32 | Rota inexistente → 404 · método não permitido → 405 | — | API | 3 | ✅ Pass | |
| CT-33 | Erros de itens (obrigatórios, inválido, inexistente, duplicado) → 422 | — | API | 6 | ✅ Pass | |
| CT-34 | Item sem `produtoId`/`quantidade` → `ITEM_INVALIDO` | — | API | 3 | ❌ Fail | [BUG-003](report-de-bugs.md#bug-003) |
| CT-35 | Fluxo completo: vitrine → cupom → checkout → confirmação | CA01, CA06 | E2E + API | 2 | ✅ Pass | |
| CT-36 | Cupom aplicado persiste ao recarregar a aba | — | Manual | — | ✅ Pass | |
| CT-37 | `/checkout` com carrinho vazio redireciona para o carrinho | — | E2E | 1 | ✅ Pass | |

## Técnicas utilizadas

| Técnica | Onde foi aplicada |
|---|---|
| Particionamento de equivalência | Cupons válido, inexistente, expirado e vazio. Dados do cliente válidos e inválidos |
| Análise de valor limite | Subtotal 199,80 / 200,00 / 219,80. Quantidade 0 / 1 / 5 / 6 |
| Tabela de decisão | Cupom × faixa de subtotal (frete antes do desconto, desconto sem incidir no frete) |
| Transição de estado | Carrinho cruzando o limite do frete. Cupom aplicado → removido → outro cupom |
| Teste de contrato de API | Status codes, formato `erro.codigo/mensagem/campo`, schema das respostas |
| Teste negativo | JSON malformado, tipos errados, campos ausentes, métodos HTTP não permitidos |
| Teste exploratório | Manipulação do `sessionStorage`, leitura do bundle, oráculo com carrinhos aleatórios |

## Sessão exploratória (resumo)

| Charter | Achados |
|---|---|
| Explorar a API com corpos de borda (tipos, ausência de campos, JSON inválido, métodos HTTP) | BUG-002, BUG-003, OBS-03 |
| Comparar com um oráculo próprio (`total = subtotal − desconto + frete`) em 200 carrinhos aleatórios, com e sem cupom | Divergências só em carrinhos com subtotal = R$ 200,00 (BUG-001). Nenhum problema de arredondamento |
| Burlar os limites da interface alterando o `sessionStorage` | BUG-002 confirmado ponta a ponta. A API recusa o cupom expirado injetado (CT-12) |
| Ler o bundle do frontend para entender onde ficam as regras | O limite de 5 unidades existe só no front. Os valores do resumo vêm da API |
| Observar o tráfego de rede ao aplicar cupom e alterar quantidades | OBS-01 (chamada duplicada ao aplicar cupom) |

## Como reproduzir esta execução

```bash
npm ci
npx playwright install --with-deps chromium
npm test                  # suíte padrão: bugs conhecidos ficam como fixme (pulados)
npm run test:bugs         # roda também os testes dos bugs: 10 falhas esperadas
npm run report            # relatório HTML do Playwright
npm run allure:generate   # gera o Allure Report (requer Java)
npm run allure:open
```
