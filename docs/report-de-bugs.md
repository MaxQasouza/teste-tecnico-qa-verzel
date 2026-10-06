# Report de bugs: VZS-142, Cupom de desconto e frete grátis

| Item | Valor |
|---|---|
| Versão testada | 2.3.0 (publicada em 30/09/2026) |
| Ambiente | https://verzel-store.qa-test-verzel-store.workers.dev |
| Navegador | Chromium (Playwright 1.63), Windows 11, viewport 1280×900 (evidências) |
| Data da execução | 06/10/2026 |
| Evidências | [`docs/evidencias/`](evidencias/), que podem ser geradas de novo com `npm run evidencias` |
| Parecer | ❌ **Não aprovado para produção** enquanto BUG-001 e BUG-002 estiverem abertos |

## Resumo

| ID | Título | Severidade | Prioridade | CA | Camada | Teste automatizado |
|---|---|---|---|---|---|---|
| [BUG-001](#bug-001) | Frete de R$ 19,90 cobrado quando o subtotal é exatamente R$ 200,00 | Alta | Alta | CA06 | API (refletido na UI) | CT-02 (`frete-pago.spec.ts`, `carrinho-calcular.spec.ts`, `pedidos.spec.ts`) |
| [BUG-002](#bug-002) | API aceita mais de 5 unidades por produto no cálculo e no pedido | Alta | Alta | CA10 | API | CT-19, CT-20 (`carrinho-calcular.spec.ts`, `pedidos.spec.ts`, `cupom-invalido-e-quantidade.spec.ts`) |
| [BUG-003](#bug-003) | Item sem `produtoId` ou sem `quantidade` não retorna `ITEM_INVALIDO` | Baixa | Baixa | Contrato de erros | API | CT-34 (`carrinho-calcular.spec.ts`, `pedidos.spec.ts`) |

**Critério de classificação**

- **Severidade** mede o impacto no negócio ou no usuário. Alta: cobrança errada ou regra de negócio violada. Baixa: divergência de contrato sem impacto financeiro.
- **Prioridade** mede a urgência da correção, considerando o impacto e a frequência.

**Como os bugs aparecem na suíte automatizada:** cada teste que reproduz um bug tem a tag `@bug`, a anotação `bug` com o ID e `test.fixme(!EXPOR_BUGS, ...)`. Em `npm test` esses 10 testes ficam pulados (a suíte passa e o relatório mostra o motivo). Em `npm run test:bugs` eles rodam e falham com screenshot, vídeo e trace. Quando um bug for corrigido, basta remover o `test.fixme` do teste correspondente.

Os comportamentos listados em "Sobre este ambiente" na documentação não foram reportados: carrinho por aba, pedidos fictícios, ausência de e-mail ou cobrança, preços fixos e API stateless.

---

<a id="bug-001"></a>
## BUG-001: Frete de R$ 19,90 cobrado quando o subtotal é exatamente R$ 200,00

| Campo | Valor |
|---|---|
| Severidade | **Alta**: o cliente paga R$ 19,90 a mais no valor exato que a campanha promete como grátis |
| Prioridade | **Alta**: é o limite da regra principal do card e o valor é fácil de atingir (2 × Mochila, 4 × Garrafa) |
| Critério violado | **CA06**: "O frete é grátis para compras com subtotal a partir de R$ 200,00, **inclusive**." Também viola a tabela "Regras de cálculo": "R$ 0,00 quando o subtotal é **igual ou maior** que R$ 200,00" |
| Endpoints afetados | `POST /api/carrinho/calcular`, `POST /api/pedidos` |
| Telas afetadas | Carrinho, Checkout e Pedido confirmado |
| Reprodutibilidade | 100% (3 composições diferentes de R$ 200,00 testadas) |

### Passos para reprodução (UI)

1. Abrir uma aba nova em https://verzel-store.qa-test-verzel-store.workers.dev/ (carrinho vazio).
2. Na vitrine, clicar 2 vezes em **Adicionar ao carrinho** no card "Mochila Urbana 20L" (R$ 100,00).
3. Acessar **Carrinho**.
4. Observar o Resumo do pedido.
5. (Opcional) Aplicar `BEMVINDO10`, finalizar a compra com dados válidos e observar a confirmação.

### Comportamento obtido

- Subtotal **R$ 200,00**, Frete **R$ 19,90**, Total **R$ 219,90**.
- O carrinho exibe a mensagem contraditória **"Faltam R$ 0,00 para o frete grátis."**
- A API retorna `freteGratis: false` com `valorFaltanteFreteGratis: 0`. Esses dois campos se contradizem.
- O pedido é confirmado cobrando o frete. Com o cupom, o total fica R$ 199,90 em vez de R$ 180,00.

### Comportamento esperado

- Frete **Grátis** (`frete: 0`, `freteGratis: true`), total **R$ 200,00** (ou R$ 180,00 com `BEMVINDO10`, já que o CA08 avalia o frete antes do desconto).
- A mensagem de valor faltante não deve ser exibida.

### Request / Response

```http
POST /api/carrinho/calcular
Content-Type: application/json

{ "itens": [ { "produtoId": "P005", "quantidade": 2 } ] }
```

```json
HTTP/1.1 200 OK
{
  "itens": [{ "produtoId": "P005", "nome": "Mochila Urbana 20L", "precoUnitario": 100, "quantidade": 2, "total": 200 }],
  "subtotal": 200,
  "desconto": 0,
  "frete": 19.9,              // esperado: 0
  "freteGratis": false,       // esperado: true
  "valorFaltanteFreteGratis": 0,
  "total": 219.9,             // esperado: 200
  "cupom": null
}
```

O pedido também é gravado com frete (`POST /api/pedidos`, itens `P005 × 1` + `P008 × 2`): `201`, `"subtotal": 200, "frete": 19.9, "freteGratis": false, "total": 219.9`.

**Controle:** o subtotal de R$ 219,80 (`P003 + P006`) retorna `frete: 0` corretamente, e o de R$ 199,80 retorna `frete: 19.9` corretamente. O defeito está só no valor exato do limite.

### Evidências

| Tipo | Arquivo |
|---|---|
| Screenshot: carrinho | [screenshots/BUG-001-carrinho-subtotal-200-cobra-frete.png](evidencias/screenshots/BUG-001-carrinho-subtotal-200-cobra-frete.png) |
| Screenshot: carrinho com cupom | [screenshots/BUG-001-carrinho-subtotal-200-com-cupom.png](evidencias/screenshots/BUG-001-carrinho-subtotal-200-com-cupom.png) |
| Screenshot: pedido confirmado | [screenshots/BUG-001-pedido-confirmado-com-frete.png](evidencias/screenshots/BUG-001-pedido-confirmado-com-frete.png) |
| Log da API | [api-logs/BUG-001-calcular-subtotal-200.json](evidencias/api-logs/BUG-001-calcular-subtotal-200.json), [api-logs/BUG-001-calcular-subtotal-200-com-cupom.json](evidencias/api-logs/BUG-001-calcular-subtotal-200-com-cupom.json), [api-logs/BUG-001-pedido-subtotal-200.json](evidencias/api-logs/BUG-001-pedido-subtotal-200.json) |
| Log de controle | [api-logs/BUG-001-controle-subtotal-219_80.json](evidencias/api-logs/BUG-001-controle-subtotal-219_80.json) |

### Análise (hipótese)

A comparação com o limite usa provavelmente `subtotal > 200` em vez de `subtotal >= 200`. O cálculo de `valorFaltanteFreteGratis` (`max(0, 200 - subtotal)`) está correto, o que explica a inconsistência entre os dois campos.

---

<a id="bug-002"></a>
## BUG-002: API aceita mais de 5 unidades por produto no cálculo e no pedido

| Campo | Valor |
|---|---|
| Severidade | **Alta**: regra de negócio do card burlável. Pedidos acima do limite são confirmados |
| Prioridade | **Alta**: o CA10 exige explicitamente a validação na API. O código `QUANTIDADE_MAXIMA_EXCEDIDA` está documentado, mas nunca é retornado |
| Critério violado | **CA10**: "Cada produto pode ter no máximo 5 unidades por pedido. **A regra vale para a interface e para a API.**" Também viola a tabela de erros: `422 QUANTIDADE_MAXIMA_EXCEDIDA` |
| Endpoints afetados | `POST /api/carrinho/calcular`, `POST /api/pedidos` |
| Reprodutibilidade | 100% (quantidades 6 e 100 testadas) |

### Passos para reprodução

**Via API**

1. Enviar `POST /api/pedidos` com `{"cliente": {"nome": "Maria Silva", "email": "maria@exemplo.com", "cep": "01310-100"}, "itens": [{"produtoId": "P005", "quantidade": 6}]}`.
2. Observar o status e o corpo da resposta.

**Via UI, contornando o limite da interface**

1. Abrir a loja, abrir o DevTools e executar no console:
   `sessionStorage.setItem('verzel-store:itens', JSON.stringify([{produtoId:'P001', quantidade:6}]))`
2. Acessar **/carrinho**. O carrinho mostra 6 × Camiseta Essencial, R$ 359,40.
3. Clicar em **Finalizar compra**, preencher dados válidos e **Confirmar pedido**.

### Comportamento obtido

- `POST /api/carrinho/calcular` com `quantidade: 6` ou `100` responde **200** e calcula normalmente (subtotal R$ 359,40 e R$ 5.990,00).
- `POST /api/pedidos` com `quantidade: 6` responde **201** e o pedido é confirmado: "Pedido VZ-xxxxxx, 6x Camiseta Essencial".

### Comportamento esperado

- As duas rotas respondem **422** com `{"erro": {"codigo": "QUANTIDADE_MAXIMA_EXCEDIDA", "campo": "itens[0].quantidade", ...}}`.
- A UI exibe o erro no checkout e não confirma o pedido.

### Request / Response

```http
POST /api/pedidos
Content-Type: application/json

{
  "cliente": { "nome": "Maria Silva", "email": "maria@exemplo.com", "cep": "01310-100" },
  "itens": [ { "produtoId": "P005", "quantidade": 6 } ]
}
```

```json
HTTP/1.1 201 Created          // esperado: 422 QUANTIDADE_MAXIMA_EXCEDIDA
{
  "numero": "VZ-042595",
  "itens": [{ "produtoId": "P005", "nome": "Mochila Urbana 20L", "precoUnitario": 100, "quantidade": 6, "total": 600 }],
  "subtotal": 600, "desconto": 0, "frete": 0, "freteGratis": true, "valorFaltanteFreteGratis": 0, "total": 600,
  "cupom": null
}
```

**Controle:** a interface aplica o limite corretamente. A vitrine desabilita o botão na 5ª unidade ("Limite de 5 unidades atingido.") e o "+" do carrinho fica desabilitado em 5. As validações de quantidade mínima e de tipo (`0`, `-1`, `1.5`, `"2"`) funcionam na API (`422 QUANTIDADE_INVALIDA`). Só a validação do máximo está ausente.

### Evidências

| Tipo | Arquivo |
|---|---|
| Screenshot: carrinho com 6 unidades | [screenshots/BUG-002-carrinho-6-unidades.png](evidencias/screenshots/BUG-002-carrinho-6-unidades.png) |
| Screenshot: pedido confirmado com 6 unidades | [screenshots/BUG-002-pedido-confirmado-6-unidades.png](evidencias/screenshots/BUG-002-pedido-confirmado-6-unidades.png) |
| Screenshot de controle: limite na vitrine | [screenshots/CONTROLE-vitrine-limite-5-unidades.png](evidencias/screenshots/CONTROLE-vitrine-limite-5-unidades.png) |
| Log da API | [api-logs/BUG-002-calcular-quantidade-6.json](evidencias/api-logs/BUG-002-calcular-quantidade-6.json), [api-logs/BUG-002-calcular-quantidade-100.json](evidencias/api-logs/BUG-002-calcular-quantidade-100.json), [api-logs/BUG-002-pedido-quantidade-6.json](evidencias/api-logs/BUG-002-pedido-quantidade-6.json) |

### Análise (hipótese)

A validação de quantidade da API verifica apenas `Number.isInteger(q) && q >= 1` e não tem o teto `q <= 5`. O limite existe só no frontend (`const Qn = 5` no bundle), e qualquer cliente HTTP ou alteração do `sessionStorage` passa por ele.

---

<a id="bug-003"></a>
## BUG-003: Item sem `produtoId` ou sem `quantidade` não retorna `ITEM_INVALIDO`

| Campo | Valor |
|---|---|
| Severidade | **Baixa**: divergência de contrato, sem impacto financeiro. O pedido continua recusado com 422 |
| Prioridade | **Baixa** |
| Regra violada | Tabela "Códigos de erro": `422 ITEM_INVALIDO`, "Um item não é um objeto com produtoId e quantidade." |
| Endpoints afetados | `POST /api/carrinho/calcular`, `POST /api/pedidos` |
| Reprodutibilidade | 100% |

### Passos para reprodução

1. Enviar `POST /api/carrinho/calcular` com `{"itens": [{"quantidade": 1}]}`.
2. Enviar `POST /api/carrinho/calcular` com `{"itens": [{"produtoId": "P001"}]}`.
3. Repetir o passo 1 em `POST /api/pedidos`, com um `cliente` válido. A resposta é a mesma.

### Comportamento obtido

| Corpo enviado | Status | Código | Campo | Mensagem |
|---|---|---|---|---|
| `{"itens":[{"quantidade":1}]}` | 422 | `PRODUTO_NAO_ENCONTRADO` | `itens[0].produtoId` | **"Produto undefined não encontrado."** |
| `{"itens":[{"produtoId":"P001"}]}` | 422 | `QUANTIDADE_INVALIDA` | `itens[0].quantidade` | "A quantidade deve ser um número inteiro maior ou igual a 1." |

### Comportamento esperado

`422` com `{"erro": {"codigo": "ITEM_INVALIDO", "mensagem": "Cada item deve ser um objeto com produtoId e quantidade.", "campo": "itens[0]"}}`, a mesma resposta que a API já dá para `{"itens": ["P001"]}`. Além do código errado, a mensagem "Produto **undefined** não encontrado." expõe um detalhe interno da implementação ao cliente da API.

### Evidências

[api-logs/BUG-003-item-sem-produtoId.json](evidencias/api-logs/BUG-003-item-sem-produtoId.json), [api-logs/BUG-003-item-sem-quantidade.json](evidencias/api-logs/BUG-003-item-sem-quantidade.json) e, de controle, [api-logs/BUG-003-controle-item-nao-objeto.json](evidencias/api-logs/BUG-003-controle-item-nao-objeto.json).

---

## Observações e sugestões de melhoria (não são bugs)

| # | Observação | Sugestão |
|---|---|---|
| OBS-01 | Ao aplicar um cupom, o frontend faz 2 chamadas idênticas a `POST /api/carrinho/calcular`. | Reaproveitar a resposta da validação do cupom para atualizar o resumo e economizar uma requisição. |
| OBS-02 | A API aceita nomes só com números (`"123 456"`), e o pedido é criado. A documentação exige apenas "nome e sobrenome". | Avaliar com o PO se o nome deve conter letras. |
| OBS-03 | Em `POST /api/pedidos` com erro no cliente e nos itens ao mesmo tempo, só o `422 DADOS_INVALIDOS` é retornado e o erro de item (ex.: produto inexistente) fica oculto. Isso é aceitável, mas a ordem de validação não está documentada. | Documentar a precedência das validações da API. |
| OBS-04 | O frontend valida o nome com mais rigor que a documentação: cada parte precisa ter 2 ou mais letras ("Maria S" é recusado). A API se comporta igual, então não há inconsistência. | Deixar a regra explícita na documentação. |
