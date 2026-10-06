import { test, expect, EXPOR_BUGS } from '../support/fixtures';
import { BUGS, CUPONS, PRODUTOS } from '../support/data';
import { brl } from '../support/money';

/**
 * Cenário 2 (obrigatório): subtotal < R$ 200,00 cobra frete de R$ 19,90
 * e informa quanto falta para o frete grátis. Cobre CA06, CA07, CA09.
 */
test.describe('Frete pago abaixo de R$ 200,00', { tag: '@e2e' }, () => {
  test('CT-03 cobra R$ 19,90 e exibe o valor faltante para o frete grátis (CA07)', async ({ vitrine, carrinho }) => {
    await vitrine.abrir();
    await vitrine.adicionar(PRODUTOS.TENIS); // 189,90
    await vitrine.irParaCarrinho();

    await expect(carrinho.resumo.subtotal).toHaveText(brl(189.9));
    await expect(carrinho.resumo.frete).toHaveText(brl(19.9));
    await expect(carrinho.resumo.total).toHaveText(brl(209.8));
    await expect(carrinho.resumo.avisoFrete).toHaveText(`Faltam ${brl(10.1)} para o frete grátis.`);
  });

  test('CT-14 desconto do cupom não incide sobre o frete (CA09)', async ({ vitrine, carrinho }) => {
    await vitrine.abrir();
    await vitrine.adicionar(PRODUTOS.MOCHILA); // 100,00
    await vitrine.irParaCarrinho();

    await carrinho.aplicarCupom(CUPONS.VALIDO);

    // 10% de 100,00 = 10,00 (e não 10% de 119,90).
    await expect(carrinho.resumo.desconto).toHaveText(`- ${brl(10)}`);
    await expect(carrinho.resumo.frete).toHaveText(brl(19.9));
    await expect(carrinho.resumo.total).toHaveText(brl(109.9));
    await expect(carrinho.resumo.avisoFrete).toHaveText(`Faltam ${brl(100)} para o frete grátis.`);
  });

  test('CT-04 subtotal R$ 199,80 (limite inferior) ainda paga frete e faltam R$ 0,20', async ({ semearCarrinho, carrinho }) => {
    await semearCarrinho([
      { produtoId: PRODUTOS.CAMISETA.id, quantidade: 1 },
      { produtoId: PRODUTOS.CALCA.id, quantidade: 1 },
    ]);
    await carrinho.abrir();

    await expect(carrinho.resumo.subtotal).toHaveText(brl(199.8));
    await expect(carrinho.resumo.frete).toHaveText(brl(19.9));
    await expect(carrinho.resumo.avisoFrete).toHaveText(`Faltam ${brl(0.2)} para o frete grátis.`);
  });

  test('CT-05 aumentar a quantidade até cruzar R$ 200,00 libera o frete grátis', async ({ vitrine, carrinho }) => {
    await vitrine.abrir();
    await vitrine.adicionar(PRODUTOS.TENIS);
    await vitrine.irParaCarrinho();
    await expect(carrinho.resumo.frete).toHaveText(brl(19.9));

    await carrinho.botaoAumentar(PRODUTOS.TENIS).click();

    await expect(carrinho.quantidade(PRODUTOS.TENIS)).toHaveText('2');
    await expect(carrinho.resumo.subtotal).toHaveText(brl(379.8));
    await expect(carrinho.resumo.frete).toHaveText('Grátis');
    await expect(carrinho.resumo.avisoFrete).toBeHidden();

    await carrinho.botaoDiminuir(PRODUTOS.TENIS).click();

    await expect(carrinho.resumo.frete).toHaveText(brl(19.9));
    await expect(carrinho.resumo.avisoFrete).toHaveText(`Faltam ${brl(10.1)} para o frete grátis.`);
  });

  test('CT-02 subtotal exatamente R$ 200,00 deve ter frete grátis (CA06)',
    { tag: '@bug', annotation: { type: 'bug', description: BUGS.FRETE_200 } },
    async ({ vitrine, carrinho }) => {
      // BUG-001 aberto: subtotal de R$ 200,00 ainda cobra frete. Pulado por padrão; roda e falha com EXPOR_BUGS=1.
      test.fixme(!EXPOR_BUGS, BUGS.FRETE_200);

      await vitrine.abrir();
      await vitrine.adicionar(PRODUTOS.MOCHILA, 2); // 2 x 100,00 = 200,00
      await vitrine.irParaCarrinho();

      await expect(carrinho.resumo.subtotal).toHaveText(brl(200));
      await expect(carrinho.resumo.frete).toHaveText('Grátis');
      await expect(carrinho.resumo.total).toHaveText(brl(200));
      await expect(carrinho.resumo.avisoFrete).toBeHidden();
    });
});
