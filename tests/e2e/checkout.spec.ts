import { test, expect } from '../support/fixtures';
import { CLIENTE_VALIDO, CUPONS, MENSAGENS, NUMERO_PEDIDO_REGEX, PRODUTOS } from '../support/data';
import { brl } from '../support/money';

/**
 * Validação dos dados do cliente no checkout (regras pré-existentes da loja).
 * Um caso por campo na interface; as demais variações ficam em api/pedidos.spec.ts.
 */
test.describe('Checkout - dados do cliente', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ semearCarrinho, checkout }) => {
    await semearCarrinho([{ produtoId: PRODUTOS.MOCHILA.id, quantidade: 1 }]);
    await checkout.abrir();
  });

  test('CT-23 campos vazios exibem mensagens de obrigatoriedade e não enviam o pedido', async ({ page, checkout }) => {
    let pedidoEnviado = false;
    page.on('request', r => { if (r.url().endsWith('/api/pedidos')) pedidoEnviado = true; });

    await checkout.botaoConfirmar.click();

    await expect(checkout.erroDoCampo(checkout.campoNome)).toHaveText(MENSAGENS.NOME_OBRIGATORIO);
    await expect(checkout.erroDoCampo(checkout.campoEmail)).toHaveText(MENSAGENS.EMAIL_OBRIGATORIO);
    await expect(checkout.erroDoCampo(checkout.campoCep)).toHaveText(MENSAGENS.CEP_OBRIGATORIO);
    await expect(checkout.campoNome).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/checkout$/);
    expect(pedidoEnviado).toBe(false);
  });

  const invalidos = [
    { id: 'CT-24', descricao: 'nome sem sobrenome', dados: { ...CLIENTE_VALIDO, nome: 'Maria' }, campo: 'nome', mensagem: MENSAGENS.NOME_SEM_SOBRENOME },
    { id: 'CT-25', descricao: 'e-mail sem domínio', dados: { ...CLIENTE_VALIDO, email: 'maria@' }, campo: 'email', mensagem: MENSAGENS.EMAIL_INVALIDO },
    { id: 'CT-26', descricao: 'CEP com 7 dígitos', dados: { ...CLIENTE_VALIDO, cep: '0131010' }, campo: 'cep', mensagem: MENSAGENS.CEP_INVALIDO },
  ] as const;

  for (const { id, descricao, dados, campo, mensagem } of invalidos) {
    test(`${id} ${descricao} exibe "${mensagem}"`, async ({ page, checkout }) => {
      await checkout.confirmar(dados);

      const campos = { nome: checkout.campoNome, email: checkout.campoEmail, cep: checkout.campoCep };
      await expect(checkout.erroDoCampo(campos[campo])).toHaveText(mensagem);
      await expect(page.locator('.mensagem-erro')).toHaveCount(1);
      await expect(page).toHaveURL(/\/checkout$/);
    });
  }

  test('CT-27 dados válidos com CEP sem hífen confirmam o pedido', async ({ page, checkout, confirmacao }) => {
    const respostaPedido = page.waitForResponse(r => r.url().endsWith('/api/pedidos'));
    await checkout.confirmar({ ...CLIENTE_VALIDO, cep: '01310100' });

    const resposta = await respostaPedido;
    expect(resposta.status()).toBe(201);
    expect((await resposta.json()).cliente.cep).toBe('01310100');

    await confirmacao.aguardar();
    await expect(confirmacao.numeroPedido).toHaveText(NUMERO_PEDIDO_REGEX);
    await expect(page.getByText('Obrigado, Maria.')).toBeVisible();
    await expect(confirmacao.resumo.total).toHaveText(brl(119.9));
  });
});

test.describe('Checkout - cupom inválido na confirmação', { tag: '@e2e' }, () => {
  test('CT-12 cupom expirado guardado na sessão é recusado ao confirmar o pedido (422)', async ({ page, semearCarrinho, checkout }) => {
    await semearCarrinho([{ produtoId: PRODUTOS.MOCHILA.id, quantidade: 1 }], CUPONS.EXPIRADO);
    await checkout.abrir();

    const respostaPedido = page.waitForResponse(r => r.url().endsWith('/api/pedidos'));
    await checkout.confirmar(CLIENTE_VALIDO);
    expect((await respostaPedido).status()).toBe(422);

    await expect(checkout.mensagemGeral(MENSAGENS.CUPOM_EXPIRADO)).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test('CT-37 checkout com carrinho vazio redireciona para o carrinho', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/carrinho$/);
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
  });
});
