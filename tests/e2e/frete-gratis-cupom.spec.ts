import { test, expect } from '../support/fixtures';
import { CLIENTE_VALIDO, CUPONS, MENSAGENS, NUMERO_PEDIDO_REGEX, PRODUTOS } from '../support/data';
import { brl } from '../support/money';

/**
 * Cenário 1 (obrigatório): adicionar itens até atingir frete grátis (>= R$ 200,00)
 * e aplicar o cupom válido BEMVINDO10. Cobre CA01, CA02, CA05, CA06, CA08, CA09.
 */
test.describe('Frete grátis com cupom BEMVINDO10', { tag: '@e2e' }, () => {
  test('CT-01 / CT-06 / CT-35 adiciona itens pela vitrine até o frete grátis, aplica BEMVINDO10 e conclui o pedido',
    async ({ page, vitrine, carrinho, checkout, confirmacao }) => {
      await test.step('Adicionar Calça (R$ 139,90) e 2 Bonés (R$ 99,80) pela vitrine', async () => {
        await vitrine.abrir();
        await vitrine.adicionar(PRODUTOS.CALCA);
        await vitrine.adicionar(PRODUTOS.BONE, 2);
        await expect(vitrine.contadorCarrinho).toHaveText('3');
        await expect(vitrine.aviso(PRODUTOS.BONE)).toHaveText('2 no carrinho');
      });

      await test.step('Carrinho mostra subtotal de R$ 239,70 com frete grátis', async () => {
        await vitrine.irParaCarrinho();
        await expect(carrinho.resumo.subtotal).toHaveText(brl(239.7));
        await expect(carrinho.resumo.frete).toHaveText('Grátis');
        await expect(carrinho.resumo.avisoFrete).toBeHidden();
        await expect(carrinho.resumo.total).toHaveText(brl(239.7));
      });

      await test.step('Aplicar BEMVINDO10: desconto de 10% só nos produtos', async () => {
        await carrinho.aplicarCupom(CUPONS.VALIDO);
        await expect(carrinho.cupomAplicado).toHaveText(`Cupom ${CUPONS.VALIDO} aplicado.`);
        await expect(carrinho.resumo.rotuloDesconto).toHaveText(`Desconto (${CUPONS.VALIDO})`);
        await expect(carrinho.resumo.desconto).toHaveText(`- ${brl(23.97)}`);
        await expect(carrinho.resumo.frete).toHaveText('Grátis');
        await expect(carrinho.resumo.total).toHaveText(brl(215.73));
      });

      await test.step('Checkout mantém os valores e o pedido é confirmado', async () => {
        await carrinho.finalizarCompra();
        await expect(checkout.resumo.total).toHaveText(brl(215.73));

        const respostaPedido = page.waitForResponse(r => r.url().endsWith('/api/pedidos'));
        await checkout.confirmar(CLIENTE_VALIDO);
        const resposta = await respostaPedido;
        expect(resposta.status()).toBe(201);
        expect(resposta.request().postDataJSON()).toMatchObject({ cupom: CUPONS.VALIDO });

        await confirmacao.aguardar();
        await expect(confirmacao.numeroPedido).toHaveText(NUMERO_PEDIDO_REGEX);
        await expect(confirmacao.resumo.desconto).toHaveText(`- ${brl(23.97)}`);
        await expect(confirmacao.resumo.total).toHaveText(brl(215.73));
      });

      await test.step('Após a confirmação o carrinho é esvaziado', async () => {
        await carrinho.abrir();
        await expect(carrinho.carrinhoVazio).toBeVisible();
      });
    });

  test('CT-13 frete grátis considera o subtotal antes do desconto (CA08)', async ({ vitrine, carrinho }) => {
    await vitrine.abrir();
    await vitrine.adicionar(PRODUTOS.TENIS); // 189,90
    await vitrine.adicionar(PRODUTOS.MEIAS); // 29,90 -> subtotal 219,80
    await vitrine.irParaCarrinho();

    await carrinho.aplicarCupom(CUPONS.VALIDO);

    // Total após o desconto (197,82) fica abaixo de 200, mas o frete continua grátis.
    await expect(carrinho.resumo.desconto).toHaveText(`- ${brl(21.98)}`);
    await expect(carrinho.resumo.frete).toHaveText('Grátis');
    await expect(carrinho.resumo.total).toHaveText(brl(197.82));
    await expect(carrinho.resumo.avisoFrete).toBeHidden();
  });

  test('CT-07 aceita o cupom "  bemvindo10  " ignorando maiúsculas e espaços (CA02)', async ({ semearCarrinho, carrinho }) => {
    await semearCarrinho([{ produtoId: PRODUTOS.JAQUETA.id, quantidade: 1 }]);
    await carrinho.abrir();

    await carrinho.aplicarCupom('  bemvindo10  ');

    await expect(carrinho.cupomAplicado).toHaveText(`Cupom ${CUPONS.VALIDO} aplicado.`);
    await expect(carrinho.resumo.desconto).toHaveText(`- ${brl(22.99)}`);
    await expect(carrinho.resumo.total).toHaveText(brl(206.91));
  });

  test('CT-11 apenas um cupom por vez: é preciso remover o atual para aplicar outro (CA05)', async ({ semearCarrinho, carrinho }) => {
    await semearCarrinho([{ produtoId: PRODUTOS.JAQUETA.id, quantidade: 1 }]);
    await carrinho.abrir();
    await carrinho.aplicarCupom(CUPONS.VALIDO);

    await expect(carrinho.cupomAplicado).toBeVisible();
    await expect(carrinho.campoCupom, 'campo some enquanto há cupom aplicado').toBeHidden();

    await carrinho.botaoRemoverCupom.click();

    await expect(carrinho.campoCupom).toBeVisible();
    await expect(carrinho.resumo.desconto).toHaveText(brl(0));
    await expect(carrinho.resumo.total).toHaveText(brl(229.9));

    await carrinho.aplicarCupom(CUPONS.EXPIRADO);
    await expect(carrinho.mensagemCupom(MENSAGENS.CUPOM_EXPIRADO)).toBeVisible();
    await expect(carrinho.resumo.desconto).toHaveText(brl(0));
  });
});
