import { test, expect, EXPOR_BUGS } from '../support/fixtures';
import { BUGS, CLIENTE_VALIDO, CUPONS, MENSAGENS, PRODUTOS } from '../support/data';
import { brl } from '../support/money';

/**
 * Cenário 3 (obrigatório): cupom inválido/expirado e tentativa de ultrapassar
 * 5 unidades de um item. Cobre CA03, CA04 e CA10.
 */
test.describe('Cupom inválido ou expirado', { tag: '@e2e' }, () => {
  const casos = [
    { id: 'CT-08', codigo: CUPONS.INEXISTENTE, mensagem: MENSAGENS.CUPOM_INVALIDO, ca: 'CA03' },
    { id: 'CT-09', codigo: CUPONS.EXPIRADO, mensagem: MENSAGENS.CUPOM_EXPIRADO, ca: 'CA04' },
    { id: 'CT-10', codigo: '   ', mensagem: MENSAGENS.CUPOM_VAZIO, ca: 'validação de campo' },
  ];

  for (const { id, codigo, mensagem, ca } of casos) {
    test(`${id} cupom "${codigo}" exibe "${mensagem}" sem aplicar desconto (${ca})`, async ({ semearCarrinho, carrinho }) => {
      await semearCarrinho([{ produtoId: PRODUTOS.MOCHILA.id, quantidade: 1 }]);
      await carrinho.abrir();

      await carrinho.aplicarCupom(codigo);

      await expect(carrinho.mensagemCupom(mensagem)).toBeVisible();
      await expect(carrinho.cupomAplicado).toBeHidden();
      await expect(carrinho.resumo.rotuloDesconto).toHaveText('Desconto');
      await expect(carrinho.resumo.desconto).toHaveText(brl(0));
      await expect(carrinho.resumo.total).toHaveText(brl(119.9));
    });
  }
});

test.describe('Limite de 5 unidades por produto', { tag: '@e2e' }, () => {
  test('CT-17 vitrine bloqueia a 6ª unidade e informa o limite (CA10)', async ({ vitrine }) => {
    await vitrine.abrir();

    await vitrine.adicionar(PRODUTOS.CAMISETA, 5);

    await expect(vitrine.aviso(PRODUTOS.CAMISETA)).toHaveText(MENSAGENS.LIMITE_VITRINE);
    await expect(vitrine.botaoAdicionar(PRODUTOS.CAMISETA)).toBeDisabled();
    await expect(vitrine.contadorCarrinho).toHaveText('5');
    // Outros produtos continuam disponíveis: o limite é por produto.
    await expect(vitrine.botaoAdicionar(PRODUTOS.BONE)).toBeEnabled();
  });

  test('CT-18 carrinho desabilita "+" em 5 unidades e "-" em 1 unidade (CA10)', async ({ vitrine, carrinho }) => {
    await vitrine.abrir();
    await vitrine.adicionar(PRODUTOS.MEIAS, 4);
    await vitrine.irParaCarrinho();

    await expect(carrinho.botaoAumentar(PRODUTOS.MEIAS)).toBeEnabled();
    await carrinho.botaoAumentar(PRODUTOS.MEIAS).click();

    await expect(carrinho.quantidade(PRODUTOS.MEIAS)).toHaveText('5');
    await expect(carrinho.botaoAumentar(PRODUTOS.MEIAS)).toBeDisabled();
    await expect(carrinho.mensagemCupom(MENSAGENS.LIMITE_CARRINHO)).toBeVisible();
    await expect(carrinho.resumo.subtotal).toHaveText(brl(149.5));

    for (let i = 0; i < 4; i++) await carrinho.botaoDiminuir(PRODUTOS.MEIAS).click();

    await expect(carrinho.quantidade(PRODUTOS.MEIAS)).toHaveText('1');
    await expect(carrinho.botaoDiminuir(PRODUTOS.MEIAS)).toBeDisabled();
  });

  test('CT-20 pedido com 6 unidades (sessão manipulada) deve ser recusado pela API (CA10)',
    { tag: '@bug', annotation: { type: 'bug', description: BUGS.QUANTIDADE_API } },
    async ({ page, semearCarrinho, checkout }) => {
      // BUG-002 aberto: a API não barra quantidade acima de 5. Pulado por padrão; roda e falha com EXPOR_BUGS=1.
      test.fixme(!EXPOR_BUGS, BUGS.QUANTIDADE_API);

      // Simula um cliente que alterou o sessionStorage para burlar o limite da interface.
      await semearCarrinho([{ produtoId: PRODUTOS.CAMISETA.id, quantidade: 6 }]);
      await checkout.abrir();

      const respostaPedido = page.waitForResponse(r => r.url().endsWith('/api/pedidos'));
      await checkout.confirmar(CLIENTE_VALIDO);
      const resposta = await respostaPedido;

      // CA10: "A regra vale para a interface e para a API".
      expect(resposta.status()).toBe(422);
      expect((await resposta.json()).erro.codigo).toBe('QUANTIDADE_MAXIMA_EXCEDIDA');
      await expect(page).toHaveURL(/\/checkout$/);
    });
});
