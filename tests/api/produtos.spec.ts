import { test, expect } from '../support/fixtures';
import { PRODUTOS } from '../support/data';

test.describe('API /api/produtos', { tag: '@api' }, () => {
  test('CT-29 GET /api/produtos responde 200 com os 8 produtos e o contrato documentado', async ({ api }) => {
    const resposta = await api.listarProdutos();

    expect(resposta.status()).toBe(200);
    expect(resposta.headers()['content-type']).toContain('application/json');

    const produtos = await resposta.json();
    expect(produtos).toHaveLength(Object.keys(PRODUTOS).length);
    for (const produto of produtos) {
      expect(produto).toEqual({
        id: expect.stringMatching(/^P\d{3}$/),
        nome: expect.any(String),
        descricao: expect.any(String),
        categoria: expect.any(String),
        preco: expect.any(Number),
      });
    }
    // Preços fixos conforme a documentação.
    const precos = Object.fromEntries(produtos.map((p: { id: string; preco: number }) => [p.id, p.preco]));
    for (const { id, preco } of Object.values(PRODUTOS)) expect(precos[id], id).toBe(preco);
  });

  test('CT-29 GET /api/produtos/{id} responde 200 com o produto', async ({ api }) => {
    const resposta = await api.consultarProduto(PRODUTOS.MOCHILA.id);

    expect(resposta.status()).toBe(200);
    expect(await resposta.json()).toMatchObject({ id: 'P005', nome: PRODUTOS.MOCHILA.nome, preco: 100 });
  });

  for (const id of ['P999', 'p001']) {
    test(`CT-30 GET /api/produtos/${id} responde 404 PRODUTO_NAO_ENCONTRADO`, async ({ api }) => {
      const resposta = await api.consultarProduto(id);

      expect(resposta.status()).toBe(404);
      expect(await resposta.json()).toEqual({
        erro: { codigo: 'PRODUTO_NAO_ENCONTRADO', mensagem: `Produto ${id} não encontrado.` },
      });
    });
  }

  test('CT-32 rota inexistente responde 404 ROTA_NAO_ENCONTRADA', async ({ request }) => {
    const resposta = await request.get('/api/rota-que-nao-existe');

    expect(resposta.status()).toBe(404);
    expect((await resposta.json()).erro.codigo).toBe('ROTA_NAO_ENCONTRADA');
  });

  const metodosNaoPermitidos = [
    { metodo: 'POST', rota: '/api/produtos' },
    { metodo: 'GET', rota: '/api/carrinho/calcular' },
  ];
  for (const { metodo, rota } of metodosNaoPermitidos) {
    test(`CT-32 ${metodo} ${rota} responde 405 METODO_NAO_PERMITIDO`, async ({ request }) => {
      const resposta = await request.fetch(rota, { method: metodo });

      expect(resposta.status()).toBe(405);
      expect((await resposta.json()).erro).toEqual({
        codigo: 'METODO_NAO_PERMITIDO',
        mensagem: `O método ${metodo} não é permitido nesta rota.`,
      });
    });
  }
});
