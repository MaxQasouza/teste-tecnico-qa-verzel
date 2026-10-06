# Cenários de teste: VZS-142, Cupom de desconto e frete grátis

| Item | Valor |
|---|---|
| Card | VZS-142 (versão 2.3.0, publicada em 30/09/2026) |
| Ambiente | https://verzel-store.qa-test-verzel-store.workers.dev |
| Base | Critérios de aceite CA01–CA11, "Regras de cálculo", "Códigos de erro" e regras da loja que já existiam |
| Formato | BDD/Gherkin em português (`# language: pt`) |

**Convenções**

- Cada cenário tem um ID `@CT-xx`, usado também na [execução](execucao-testes.md) e nos títulos dos testes automatizados.
- As tags `@CAxx` ligam o cenário ao critério de aceite. `@ui` e `@api` indicam a camada. `@bug` marca cenários que hoje falham.
- Valores monetários seguem a interface (`R$ 0,00`). Nos passos de API, os valores são números (`19.9`).
- Todos os cenários são automatizados, exceto o CT-36 (executado manualmente).
- Ficam fora de escopo, conforme a documentação: login, cadastro, pagamento online, consulta de pedidos, persistência de pedidos e envio de e-mail.

## Mapeamento: critérios de aceite × cenários

Cada critério de aceite do card está coberto por pelo menos um cenário. ❌ indica cenário que hoje falha por um bug aberto ([report-de-bugs.md](report-de-bugs.md)).

| CA | Critério de aceite | Cenários | Camadas automatizadas | Situação |
|---|---|---|---|---|
| CA01 | `BEMVINDO10` aplica 10% sobre o subtotal dos produtos | CT-06, CT-35 | E2E + API | ✅ Atendido |
| CA02 | Código do cupom ignora maiúsculas/minúsculas e espaços nas pontas | CT-07, CT-09 | E2E + API | ✅ Atendido |
| CA03 | Cupom inexistente exibe "Cupom inválido." e não aplica desconto | CT-08, CT-12 | E2E + API | ✅ Atendido |
| CA04 | Cupom expirado exibe "Cupom expirado." e não aplica desconto | CT-09, CT-12 | E2E + API | ✅ Atendido |
| CA05 | Apenas um cupom por vez; para trocar, remove o atual | CT-11 | E2E | ✅ Atendido |
| CA06 | Frete grátis a partir de R$ 200,00, inclusive | CT-01, **CT-02 ❌**, CT-04, CT-05 | E2E + API | ❌ Reprovado (BUG-001) |
| CA07 | Abaixo de R$ 200,00: frete R$ 19,90 e aviso do valor faltante | CT-03, CT-04, CT-05, CT-15 | E2E + API | ✅ Atendido |
| CA08 | Frete grátis considera o subtotal antes do desconto | CT-13, CT-15 | E2E + API | ✅ Atendido |
| CA09 | Desconto não incide sobre o frete | CT-14 | E2E + API | ✅ Atendido |
| CA10 | Máximo de 5 unidades por produto, na interface e na API | CT-17, CT-18, **CT-19 ❌**, **CT-20 ❌**, CT-22 | E2E + API | ❌ Reprovado (BUG-002) |
| CA11 | Valores arredondados para 2 casas decimais | CT-06, CT-16 | API | ✅ Atendido |

Fora dos CAs, mas dentro do escopo do card:

| Grupo | Cenários |
|---|---|
| Regras da loja no checkout (nome, e-mail, CEP) | CT-23 a CT-28 |
| Contrato da API (status e códigos de erro 400/404/405/422) | CT-29 a CT-33, **CT-34 ❌** (BUG-003) |
| Fluxo completo e navegação | CT-35, CT-36 (manual), CT-37 |

## Massa de dados

| Id | Produto | Preço |
|---|---|---|
| P001 | Camiseta Essencial | R$ 59,90 |
| P002 | Calça Jeans Slim | R$ 139,90 |
| P003 | Tênis Casual Urbano | R$ 189,90 |
| P004 | Boné Aba Curva | R$ 49,90 |
| P005 | Mochila Urbana 20L | R$ 100,00 |
| P006 | Kit 3 Pares de Meias | R$ 29,90 |
| P007 | Jaqueta Corta-Vento | R$ 229,90 |
| P008 | Garrafa Térmica 750ml | R$ 50,00 |

Cupons: `BEMVINDO10` (10%, válido) e `VERAO2026` (15%, expirado em 31/03/2026).

Combinações usadas na análise de valor limite em torno de R$ 200,00:

| Subtotal | Composição | Partição |
|---|---|---|
| R$ 189,90 | 1 × P003 | abaixo do limite |
| R$ 199,80 | 1 × P001 + 1 × P002 | limite − R$ 0,20 (o valor mais próximo possível com o catálogo) |
| **R$ 200,00** | 2 × P005 · 4 × P008 · 1 × P005 + 2 × P008 | **no limite** |
| R$ 219,80 | 1 × P003 + 1 × P006 | acima do limite |

---

## Funcionalidade 1: Frete grátis e frete fixo

```gherkin
# language: pt
Funcionalidade: Cálculo de frete no carrinho
  Como cliente da Verzel Store
  Quero ganhar frete grátis em compras a partir de R$ 200,00
  Para pagar menos nas minhas compras

  Contexto:
    Dado que o carrinho do navegador está vazio
    E que estou na vitrine de produtos

  @CT-01 @CA06 @ui @api
  Cenário: Frete grátis com subtotal acima de R$ 200,00
    Quando adiciono 1 "Calça Jeans Slim" e 2 "Boné Aba Curva" ao carrinho
    E acesso o carrinho
    Então o subtotal deve ser "R$ 239,70"
    E o frete deve ser "Grátis"
    E o total deve ser "R$ 239,70"
    E não deve ser exibida a mensagem de valor faltante para o frete grátis

  @CT-02 @CA06 @ui @api @bug
  Cenário: Frete grátis com subtotal exatamente igual a R$ 200,00
    Quando adiciono 2 "Mochila Urbana 20L" ao carrinho
    E acesso o carrinho
    Então o subtotal deve ser "R$ 200,00"
    E o frete deve ser "Grátis"
    E o total deve ser "R$ 200,00"
    E não deve ser exibida a mensagem de valor faltante para o frete grátis

  @CT-03 @CA07 @ui @api
  Cenário: Frete fixo e valor faltante com subtotal abaixo de R$ 200,00
    Quando adiciono 1 "Tênis Casual Urbano" ao carrinho
    E acesso o carrinho
    Então o subtotal deve ser "R$ 189,90"
    E o frete deve ser "R$ 19,90"
    E o total deve ser "R$ 209,80"
    E deve ser exibida a mensagem "Faltam R$ 10,10 para o frete grátis."

  @CT-04 @CA06 @CA07 @api
  Esquema do Cenário: Valores limite da regra de frete
    Dado um carrinho com subtotal de <subtotal>
    Quando o carrinho é calculado
    Então o frete deve ser <frete>
    E freteGratis deve ser <freteGratis>
    E o valor faltante para o frete grátis deve ser <faltante>

    Exemplos:
      | subtotal | frete | freteGratis | faltante |
      | 189.9    | 19.9  | false       | 10.1     |
      | 199.8    | 19.9  | false       | 0.2      |
      | 200      | 0     | true        | 0        |
      | 219.8    | 0     | true        | 0        |

  @CT-05 @CA06 @CA07 @ui
  Cenário: Frete muda quando o subtotal cruza o limite de R$ 200,00
    Dado que tenho 1 "Tênis Casual Urbano" no carrinho
    E o frete exibido é "R$ 19,90"
    Quando aumento a quantidade do "Tênis Casual Urbano" para 2
    Então o subtotal deve ser "R$ 379,80"
    E o frete deve ser "Grátis"
    Quando diminuo a quantidade do "Tênis Casual Urbano" para 1
    Então o frete deve voltar a ser "R$ 19,90"
    E deve ser exibida a mensagem "Faltam R$ 10,10 para o frete grátis."
```

## Funcionalidade 2: Cupom de desconto

```gherkin
# language: pt
Funcionalidade: Aplicação de cupom de desconto
  Como cliente da Verzel Store
  Quero aplicar um cupom de desconto no carrinho
  Para pagar menos nos produtos

  Contexto:
    Dado que tenho 1 "Mochila Urbana 20L" no carrinho

  @CT-06 @CA01 @CA11 @ui @api
  Cenário: Cupom BEMVINDO10 aplica 10% sobre o subtotal dos produtos
    Quando informo o cupom "BEMVINDO10"
    E clico em "Aplicar cupom"
    Então deve ser exibido "Cupom BEMVINDO10 aplicado."
    E o desconto deve ser "- R$ 10,00"
    E o rótulo do desconto deve ser "Desconto (BEMVINDO10)"
    E o total deve ser "R$ 109,90"

  @CT-07 @CA02 @ui @api
  Esquema do Cenário: Código do cupom ignora maiúsculas/minúsculas e espaços nas pontas
    Quando informo o cupom "<codigo>"
    E clico em "Aplicar cupom"
    Então o cupom aplicado deve ser "BEMVINDO10"
    E o desconto deve ser "- R$ 10,00"

    Exemplos:
      | codigo            |
      | bemvindo10        |
      | BemVindo10        |
      |   bemvindo10      |
      | \tBEMVINDO10\n    |

  @CT-08 @CA03 @ui @api
  Esquema do Cenário: Cupom inexistente é recusado
    Quando informo o cupom "<codigo>"
    E clico em "Aplicar cupom"
    Então deve ser exibida a mensagem "Cupom inválido."
    E o desconto deve ser "R$ 0,00"
    E o total deve ser "R$ 119,90"

    Exemplos:
      | codigo                |
      | CUPOMFAKE99           |
      | BEMVINDO10 BEMVINDO10 |

  @CT-09 @CA04 @ui @api
  Esquema do Cenário: Cupom expirado é recusado
    Quando informo o cupom "<codigo>"
    E clico em "Aplicar cupom"
    Então deve ser exibida a mensagem "Cupom expirado."
    E o desconto deve ser "R$ 0,00"
    E o total deve ser "R$ 119,90"

    Exemplos:
      | codigo      |
      | VERAO2026   |
      | verao2026   |
      |  verao2026  |

  @CT-10 @ui @api
  Cenário: Cupom em branco não é enviado para cálculo
    Quando informo o cupom "   "
    E clico em "Aplicar cupom"
    Então deve ser exibida a mensagem "Informe um cupom."
    E nenhum desconto deve ser aplicado

  @CT-11 @CA05 @ui
  Cenário: Apenas um cupom por vez, trocando via remoção
    Dado que apliquei o cupom "BEMVINDO10"
    Então o campo de cupom não deve estar disponível
    E deve ser exibido o botão "Remover cupom"
    Quando clico em "Remover cupom"
    Então o desconto deve ser "R$ 0,00"
    E o campo de cupom deve voltar a ser exibido
    Quando informo o cupom "VERAO2026" e clico em "Aplicar cupom"
    Então deve ser exibida a mensagem "Cupom expirado."

  @CT-12 @CA03 @CA04 @ui @api
  Esquema do Cenário: Pedido com cupom inválido ou expirado é recusado com 422
    Dado que o carrinho contém o cupom "<codigo>"
    Quando confirmo o pedido com dados de cliente válidos
    Então a API deve responder 422 com o código "<erro>" e campo "cupom"
    E a mensagem "<mensagem>" deve ser exibida no checkout
    E o pedido não deve ser confirmado

    Exemplos:
      | codigo      | erro           | mensagem         |
      | CUPOMFAKE99 | CUPOM_INVALIDO | Cupom inválido.  |
      | VERAO2026   | CUPOM_EXPIRADO | Cupom expirado.  |

  @CT-36 @ui @manual
  Cenário: Cupom aplicado continua aplicado ao recarregar a aba
    Dado que apliquei o cupom "BEMVINDO10"
    Quando recarrego a página do carrinho
    Então o cupom "BEMVINDO10" deve continuar aplicado
    E o total deve ser "R$ 109,90"
```

## Funcionalidade 3: Precedência entre desconto e frete

```gherkin
# language: pt
Funcionalidade: Ordem de cálculo entre cupom e frete
  Regra: total = subtotal - desconto + frete
  O frete grátis considera o subtotal ANTES do desconto,
  e o desconto NÃO incide sobre o frete.

  @CT-13 @CA08 @ui @api
  Cenário: Frete grátis é mantido quando o desconto deixa o total abaixo de R$ 200,00
    Dado que tenho 1 "Tênis Casual Urbano" e 1 "Kit 3 Pares de Meias" no carrinho
    E o subtotal é "R$ 219,80"
    Quando aplico o cupom "BEMVINDO10"
    Então o desconto deve ser "- R$ 21,98"
    E o frete deve continuar "Grátis"
    E o total deve ser "R$ 197,82"

  @CT-14 @CA09 @ui @api
  Cenário: Desconto não incide sobre o frete
    Dado que tenho 1 "Mochila Urbana 20L" no carrinho
    Quando aplico o cupom "BEMVINDO10"
    Então o desconto deve ser "- R$ 10,00" (10% de R$ 100,00, e não de R$ 119,90)
    E o frete deve continuar "R$ 19,90"
    E o total deve ser "R$ 109,90"

  @CT-15 @CA07 @CA08 @api
  Cenário: Subtotal abaixo do limite continua pagando frete mesmo com cupom
    Dado um carrinho com 1 "Camiseta Essencial" e 1 "Calça Jeans Slim" (R$ 199,80)
    Quando aplico o cupom "BEMVINDO10"
    Então o desconto deve ser 19.98
    E o frete deve ser 19.9
    E o total deve ser 199.72

  @CT-16 @CA11 @api
  Esquema do Cenário: Valores arredondados para 2 casas decimais
    Dado um carrinho com <itens>
    Quando aplico o cupom "BEMVINDO10"
    Então o subtotal deve ser <subtotal>
    E o desconto deve ser <desconto>
    E o total deve ser <total>
    E nenhum valor monetário da resposta deve ter mais de 2 casas decimais

    Exemplos:
      | itens                 | subtotal | desconto | total  |
      | 3 × P004              | 149.7    | 14.97    | 154.63 |
      | 3 × P001 + 3 × P006   | 269.4    | 26.94    | 242.46 |
      | 1 × P001 + 1 × P006   | 89.8     | 8.98     | 100.72 |
```

## Funcionalidade 4: Limite de quantidade por produto

```gherkin
# language: pt
Funcionalidade: Limite de 5 unidades por produto
  A regra vale para a interface e para a API (CA10).

  @CT-17 @CA10 @ui
  Cenário: Vitrine bloqueia a sexta unidade de um produto
    Dado que estou na vitrine
    Quando adiciono 5 unidades de "Camiseta Essencial"
    Então deve ser exibido "Limite de 5 unidades atingido." no card do produto
    E o botão "Adicionar ao carrinho" da "Camiseta Essencial" deve estar desabilitado
    E o botão "Adicionar ao carrinho" dos demais produtos deve continuar habilitado

  @CT-18 @CA10 @ui
  Cenário: Seletor de quantidade do carrinho respeita os limites de 1 e 5
    Dado que tenho 4 "Kit 3 Pares de Meias" no carrinho
    Quando clico em "+"
    Então a quantidade deve ser 5
    E o botão "+" deve ficar desabilitado
    E deve ser exibido "Limite de 5 unidades por produto."
    Quando diminuo a quantidade até 1
    Então o botão "-" deve ficar desabilitado

  @CT-19 @CA10 @api @bug
  Esquema do Cenário: API de cálculo recusa quantidade acima de 5
    Quando envio POST /api/carrinho/calcular com quantidade <quantidade> do produto "P001"
    Então a resposta deve ser 422
    E o código de erro deve ser "QUANTIDADE_MAXIMA_EXCEDIDA" no campo "itens[0].quantidade"

    Exemplos:
      | quantidade |
      | 6          |
      | 100        |

  @CT-20 @CA10 @ui @api @bug
  Cenário: Pedido com mais de 5 unidades é recusado mesmo com a interface burlada
    Dado que o carrinho na sessão do navegador foi alterado para 6 "Camiseta Essencial"
    Quando confirmo o pedido com dados de cliente válidos
    Então POST /api/pedidos deve responder 422 "QUANTIDADE_MAXIMA_EXCEDIDA"
    E o pedido não deve ser confirmado

  @CT-21 @api
  Esquema do Cenário: Quantidade inválida
    Quando envio um item com quantidade <quantidade>
    Então a resposta deve ser 422 "QUANTIDADE_INVALIDA" no campo "itens[0].quantidade"

    Exemplos:
      | quantidade |
      | 0          |
      | -1         |
      | 1.5        |
      | "2"        |

  @CT-22 @CA10 @api
  Cenário: Quantidade igual ao limite é aceita
    Quando calculo um carrinho com 5 "Jaqueta Corta-Vento" e 5 "Tênis Casual Urbano"
    Então a resposta deve ser 200
    E o subtotal deve ser 2099
```

## Funcionalidade 5: Dados do cliente no checkout

```gherkin
# language: pt
Funcionalidade: Validação dos dados de entrega
  Regras que já existiam na loja: nome e sobrenome, e-mail válido,
  CEP com 8 dígitos (com ou sem hífen).

  Contexto:
    Dado que tenho 1 "Mochila Urbana 20L" no carrinho
    E estou na página de checkout

  @CT-23 @ui
  Cenário: Campos obrigatórios em branco
    Quando clico em "Confirmar pedido" sem preencher os campos
    Então devem ser exibidas as mensagens:
      | campo         | mensagem                 |
      | Nome completo | Informe o nome completo. |
      | E-mail        | Informe o e-mail.        |
      | CEP           | Informe o CEP.           |
    E nenhuma requisição para /api/pedidos deve ser feita

  @CT-24 @ui @api
  Esquema do Cenário: Nome sem sobrenome
    Quando preencho o nome com "<nome>" e os demais campos válidos
    E confirmo o pedido
    Então deve ser exibida a mensagem "Informe nome e sobrenome."

    Exemplos:
      | nome          |
      | Maria         |
      | Maria S       |
      |    Maria      |

  @CT-25 @ui @api
  Esquema do Cenário: E-mail em formato inválido
    Quando preencho o e-mail com "<email>" e os demais campos válidos
    E confirmo o pedido
    Então deve ser exibida a mensagem "Informe um e-mail válido."

    Exemplos:
      | email                   |
      | maria@                  |
      | maria@exemplo           |
      | maria.exemplo.com       |
      | maria silva@exemplo.com |

  @CT-26 @ui @api
  Esquema do Cenário: CEP fora do formato de 8 dígitos
    Quando preencho o CEP com "<cep>" e os demais campos válidos
    E confirmo o pedido
    Então deve ser exibida a mensagem "Informe um CEP com 8 dígitos."

    Exemplos:
      | cep        |
      | 0131010    |
      | 013101000  |
      | ABCDE-FGH  |
      | 01310 100  |
      | 01.310-100 |

  @CT-27 @ui @api
  Esquema do Cenário: CEP válido com ou sem hífen
    Quando preencho nome "Maria Silva", e-mail "maria@exemplo.com" e CEP "<cep>"
    E confirmo o pedido
    Então o pedido deve ser confirmado com número no formato "VZ-000000"
    E o CEP retornado pela API deve ser "01310100"

    Exemplos:
      | cep       |
      | 01310-100 |
      | 01310100  |

  @CT-28 @api
  Cenário: API lista todos os campos inválidos do cliente
    Quando envio POST /api/pedidos sem o objeto "cliente"
    Então a resposta deve ser 422 "DADOS_INVALIDOS"
    E "campos" deve conter cliente.nome, cliente.email e cliente.cep com suas mensagens
```

## Funcionalidade 6: Contrato da API e fluxo completo

```gherkin
# language: pt
Funcionalidade: Contrato da API e fluxo de compra
  @CT-29 @api
  Cenário: Listagem e consulta de produtos
    Quando envio GET /api/produtos
    Então a resposta deve ser 200 com 8 produtos
    E cada produto deve ter id, nome, descricao, categoria e preco
    Quando envio GET /api/produtos/P005
    Então a resposta deve ser 200 com o produto "Mochila Urbana 20L"

  @CT-30 @api
  Cenário: Consulta de produto inexistente
    Quando envio GET /api/produtos/P999
    Então a resposta deve ser 404 "PRODUTO_NAO_ENCONTRADO"

  @CT-31 @api
  Cenário: Corpo que não é um objeto JSON
    Quando envio um corpo malformado, "[]" ou "null" para /api/carrinho/calcular ou /api/pedidos
    Então a resposta deve ser 400 "JSON_INVALIDO"

  @CT-32 @api
  Cenário: Rota inexistente e método não permitido
    Quando envio GET /api/rota-que-nao-existe
    Então a resposta deve ser 404 "ROTA_NAO_ENCONTRADA"
    Quando envio GET /api/carrinho/calcular
    Então a resposta deve ser 405 "METODO_NAO_PERMITIDO"

  @CT-33 @api
  Esquema do Cenário: Erros de validação de itens
    Quando envio o corpo <corpo>
    Então a resposta deve ser 422 com código "<codigo>" no campo "<campo>"

    Exemplos:
      | corpo                                                        | codigo                 | campo              |
      | {}                                                           | ITENS_OBRIGATORIOS     | itens              |
      | {"itens": []}                                                | ITENS_OBRIGATORIOS     | itens              |
      | {"itens": ["P001"]}                                          | ITEM_INVALIDO          | itens[0]           |
      | {"itens": [{"produtoId": "P999", "quantidade": 1}]}          | PRODUTO_NAO_ENCONTRADO | itens[0].produtoId |
      | {"itens": [{"produtoId":"P001","quantidade":1}, {"produtoId":"P001","quantidade":2}]} | ITEM_DUPLICADO | itens[1].produtoId |

  @CT-34 @api @bug
  Esquema do Cenário: Item sem produtoId ou sem quantidade é um item inválido
    Quando envio o item <item> para /api/carrinho/calcular ou /api/pedidos
    Então a resposta deve ser 422 com código "ITEM_INVALIDO" no campo "itens[0]"

    Exemplos:
      | item                   |
      | {"quantidade": 1}      |
      | {"produtoId": "P001"}  |

  @CT-35 @ui @api
  Cenário: Compra completa com frete grátis e cupom
    Dado que adicionei 1 "Calça Jeans Slim" e 2 "Boné Aba Curva" pela vitrine
    E apliquei o cupom "BEMVINDO10" no carrinho
    Quando finalizo a compra com nome "Maria Silva", e-mail "maria@exemplo.com" e CEP "01310-100"
    Então a API deve responder 201
    E a página "Pedido confirmado" deve exibir o número no formato "VZ-000000"
    E o resumo deve exibir desconto "- R$ 23,97", frete "Grátis" e total "R$ 215,73"
    E o carrinho deve ficar vazio

  @CT-37 @ui
  Cenário: Checkout sem itens no carrinho
    Dado que o carrinho está vazio
    Quando acesso /checkout diretamente
    Então devo ser redirecionado para /carrinho com a mensagem "Seu carrinho está vazio"
```
