import { test, expect, EXPOR_BUGS } from '../support/fixtures';
import { resumoEsperado, ErroApi } from '../support/api-client';
import { BUGS, CUPONS, MENSAGENS, PRODUTOS, Produto } from '../support/data';
import { arredondar, casasDecimais } from '../support/money';

type Linha = [Produto, number];
const itens = (...linhas: Linha[]) => linhas.map(([p, quantidade]) => ({ produtoId: p.id, quantidade }));
const precos = (...linhas: Linha[]) => linhas.map(([p, quantidade]) => ({ preco: p.preco, quantidade }));

test.describe('API POST /api/carrinho/calcular - regras de cálculo', { tag: '@api' }, () => {
  // Análise de valor limite e partições em torno de R$ 200,00 (CA06/CA07), com e sem cupom (CA01/CA08/CA09/CA11).
  const cenarios: Array<{ id: string; descricao: string; linhas: Linha[]; cupom?: string }> = [
    { id: 'CT-03', descricao: 'subtotal 189,90 cobra frete e faltam 10,10', linhas: [[PRODUTOS.TENIS, 1]] },
    { id: 'CT-04', descricao: 'subtotal 199,80 (limite - 0,20) cobra frete', linhas: [[PRODUTOS.CAMISETA, 1], [PRODUTOS.CALCA, 1]] },
    { id: 'CT-01', descricao: 'subtotal 219,80 tem frete grátis', linhas: [[PRODUTOS.TENIS, 1], [PRODUTOS.MEIAS, 1]] },
    { id: 'CT-06', descricao: 'exemplo da documentação com BEMVINDO10', linhas: [[PRODUTOS.CALCA, 1], [PRODUTOS.BONE, 2]], cupom: CUPONS.VALIDO },
    { id: 'CT-13', descricao: 'frete grátis avaliado antes do desconto (219,80 -> 197,82)', linhas: [[PRODUTOS.TENIS, 1], [PRODUTOS.MEIAS, 1]], cupom: CUPONS.VALIDO },
    { id: 'CT-14', descricao: 'desconto não incide sobre o frete', linhas: [[PRODUTOS.MOCHILA, 1]], cupom: CUPONS.VALIDO },
    { id: 'CT-15', descricao: '199,80 com cupom continua pagando frete', linhas: [[PRODUTOS.CAMISETA, 1], [PRODUTOS.CALCA, 1]], cupom: CUPONS.VALIDO },
    { id: 'CT-16', descricao: 'arredondamento 149,70 -> desconto 14,97', linhas: [[PRODUTOS.BONE, 3]], cupom: CUPONS.VALIDO },
    { id: 'CT-16', descricao: 'arredondamento 269,40 -> desconto 26,94', linhas: [[PRODUTOS.CAMISETA, 3], [PRODUTOS.MEIAS, 3]], cupom: CUPONS.VALIDO },
    { id: 'CT-16', descricao: 'arredondamento 89,80 -> desconto 8,98', linhas: [[PRODUTOS.CAMISETA, 1], [PRODUTOS.MEIAS, 1]], cupom: CUPONS.VALIDO },
    { id: 'CT-22', descricao: 'quantidade máxima permitida (5) em dois produtos', linhas: [[PRODUTOS.JAQUETA, 5], [PRODUTOS.TENIS, 5]] },
  ];

  for (const { id, descricao, linhas, cupom } of cenarios) {
    test(`${id} ${descricao}`, async ({ api }) => {
      const resposta = await api.calcularCarrinho({ itens: itens(...linhas), cupom });

      expect(resposta.status()).toBe(200);
      const corpo = await resposta.json();
      expect(corpo).toMatchObject(resumoEsperado(precos(...linhas), cupom === CUPONS.VALIDO));
      // CA11: nenhum valor monetário com mais de 2 casas decimais (ex.: 179.70000000000002).
      const valores = [corpo.subtotal, corpo.desconto, corpo.frete, corpo.total, corpo.valorFaltanteFreteGratis];
      for (const item of corpo.itens) {
        expect(item.total).toBe(arredondar(item.precoUnitario * item.quantidade));
        valores.push(item.total);
      }
      for (const valor of valores) expect(casasDecimais(valor), String(valor)).toBeLessThanOrEqual(2);
    });
  }

  test('CT-02 subtotal exatamente R$ 200,00 deve ter frete grátis (CA06)',
    { tag: '@bug', annotation: { type: 'bug', description: BUGS.FRETE_200 } },
    async ({ api }) => {
      // BUG-001 aberto: subtotal de R$ 200,00 ainda cobra frete. Pulado por padrão; roda e falha com EXPOR_BUGS=1.
      test.fixme(!EXPOR_BUGS, BUGS.FRETE_200);

      for (const linhas of [[[PRODUTOS.MOCHILA, 2]], [[PRODUTOS.GARRAFA, 4]], [[PRODUTOS.MOCHILA, 1], [PRODUTOS.GARRAFA, 2]]] as Linha[][]) {
        const resposta = await api.calcularCarrinho({ itens: itens(...linhas) });
        expect.soft(await resposta.json()).toMatchObject({
          subtotal: 200,
          frete: 0,
          freteGratis: true,
          valorFaltanteFreteGratis: 0,
          total: 200,
        });
      }
    });
});

test.describe('API POST /api/carrinho/calcular - cupons', { tag: '@api' }, () => {
  for (const codigo of ['BEMVINDO10', 'bemvindo10', 'BemVindo10', '  bemvindo10  ', '\tBEMVINDO10\n']) {
    test(`CT-07 cupom ${JSON.stringify(codigo)} é normalizado e aplicado (CA02)`, async ({ api }) => {
      const resposta = await api.calcularCarrinho({ itens: itens([PRODUTOS.MOCHILA, 1]), cupom: codigo });

      expect(await resposta.json()).toMatchObject({
        desconto: 10,
        total: 109.9,
        cupom: { codigo: CUPONS.VALIDO, aplicado: true, mensagem: MENSAGENS.CUPOM_APLICADO },
      });
    });
  }

  const recusados = [
    { id: 'CT-08', codigo: CUPONS.INEXISTENTE, mensagem: MENSAGENS.CUPOM_INVALIDO },
    { id: 'CT-08', codigo: 'BEMVINDO10 BEMVINDO10', mensagem: MENSAGENS.CUPOM_INVALIDO },
    { id: 'CT-09', codigo: CUPONS.EXPIRADO, mensagem: MENSAGENS.CUPOM_EXPIRADO },
    { id: 'CT-09', codigo: ' verao2026 ', mensagem: MENSAGENS.CUPOM_EXPIRADO },
  ];
  for (const { id, codigo, mensagem } of recusados) {
    test(`${id} cupom ${JSON.stringify(codigo)} responde 200 sem desconto e mensagem "${mensagem}"`, async ({ api }) => {
      const resposta = await api.calcularCarrinho({ itens: itens([PRODUTOS.MOCHILA, 1]), cupom: codigo });

      expect(resposta.status()).toBe(200);
      const corpo = await resposta.json();
      expect(corpo).toMatchObject({ desconto: 0, total: 119.9 });
      expect(corpo.cupom).toMatchObject({ aplicado: false, mensagem });
    });
  }

  test('CT-10 cupom vazio ou nulo é ignorado (cupom: null)', async ({ api }) => {
    for (const cupom of ['', null, undefined]) {
      const resposta = await api.calcularCarrinho({ itens: itens([PRODUTOS.MOCHILA, 1]), cupom });
      expect.soft(await resposta.json(), `cupom=${cupom}`).toMatchObject({ desconto: 0, cupom: null });
    }
  });
});

test.describe('API POST /api/carrinho/calcular - contrato de erros', { tag: '@api' }, () => {
  test('CT-31 corpo que não é objeto JSON responde 400 JSON_INVALIDO', async ({ api }) => {
    for (const corpo of ['isto não é json', '[]', 'null', '{"itens": [']) {
      const resposta = await api.postBruto('/api/carrinho/calcular', corpo);
      expect.soft(resposta.status(), corpo).toBe(400);
      expect.soft(await resposta.json(), corpo).toEqual({
        erro: { codigo: 'JSON_INVALIDO', mensagem: 'O corpo da requisição deve ser um objeto JSON válido.' },
      });
    }
  });

  const erros422: Array<{ id: string; descricao: string; body: unknown; codigo: string; campo: string }> = [
    { id: 'CT-33', descricao: 'sem itens', body: {}, codigo: 'ITENS_OBRIGATORIOS', campo: 'itens' },
    { id: 'CT-33', descricao: 'lista de itens vazia', body: { itens: [] }, codigo: 'ITENS_OBRIGATORIOS', campo: 'itens' },
    { id: 'CT-33', descricao: 'item que não é objeto', body: { itens: ['P001'] }, codigo: 'ITEM_INVALIDO', campo: 'itens[0]' },
    { id: 'CT-33', descricao: 'produto inexistente', body: { itens: [{ produtoId: 'P999', quantidade: 1 }] }, codigo: 'PRODUTO_NAO_ENCONTRADO', campo: 'itens[0].produtoId' },
    { id: 'CT-33', descricao: 'produto duplicado', body: { itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 2 }] }, codigo: 'ITEM_DUPLICADO', campo: 'itens[1].produtoId' },
    { id: 'CT-21', descricao: 'quantidade 0', body: { itens: [{ produtoId: 'P001', quantidade: 0 }] }, codigo: 'QUANTIDADE_INVALIDA', campo: 'itens[0].quantidade' },
    { id: 'CT-21', descricao: 'quantidade negativa', body: { itens: [{ produtoId: 'P001', quantidade: -1 }] }, codigo: 'QUANTIDADE_INVALIDA', campo: 'itens[0].quantidade' },
    { id: 'CT-21', descricao: 'quantidade decimal', body: { itens: [{ produtoId: 'P001', quantidade: 1.5 }] }, codigo: 'QUANTIDADE_INVALIDA', campo: 'itens[0].quantidade' },
    { id: 'CT-21', descricao: 'quantidade como string', body: { itens: [{ produtoId: 'P001', quantidade: '2' }] }, codigo: 'QUANTIDADE_INVALIDA', campo: 'itens[0].quantidade' },
  ];
  for (const { id, descricao, body, codigo, campo } of erros422) {
    test(`${id} ${descricao} responde 422 ${codigo}`, async ({ api }) => {
      const resposta = await api.calcularCarrinho(body);

      expect(resposta.status()).toBe(422);
      const { erro } = (await resposta.json()) as ErroApi;
      expect(erro).toMatchObject({ codigo, campo, mensagem: expect.any(String) });
    });
  }

  for (const quantidade of [6, 100]) {
    test(`CT-19 quantidade ${quantidade} deve responder 422 QUANTIDADE_MAXIMA_EXCEDIDA (CA10)`,
      { tag: '@bug', annotation: { type: 'bug', description: BUGS.QUANTIDADE_API } },
      async ({ api }) => {
        // BUG-002 aberto: a API não barra quantidade acima de 5. Pulado por padrão; roda e falha com EXPOR_BUGS=1.
        test.fixme(!EXPOR_BUGS, BUGS.QUANTIDADE_API);

        const resposta = await api.calcularCarrinho({ itens: [{ produtoId: 'P001', quantidade }] });

        expect(resposta.status()).toBe(422);
        expect((await resposta.json()).erro).toMatchObject({ codigo: 'QUANTIDADE_MAXIMA_EXCEDIDA', campo: 'itens[0].quantidade' });
      });
  }

  const itensIncompletos = [
    { descricao: 'item sem produtoId', item: { quantidade: 1 } },
    { descricao: 'item sem quantidade', item: { produtoId: 'P001' } },
  ];
  for (const { descricao, item } of itensIncompletos) {
    test(`CT-34 ${descricao} deve responder 422 ITEM_INVALIDO`,
      { tag: '@bug', annotation: { type: 'bug', description: BUGS.ITEM_INVALIDO } },
      async ({ api }) => {
        // BUG-003 aberto: item incompleto não retorna ITEM_INVALIDO. Pulado por padrão; roda e falha com EXPOR_BUGS=1.
        test.fixme(!EXPOR_BUGS, BUGS.ITEM_INVALIDO);

        const resposta = await api.calcularCarrinho({ itens: [item] });

        expect(resposta.status()).toBe(422);
        expect((await resposta.json()).erro).toMatchObject({ codigo: 'ITEM_INVALIDO', campo: 'itens[0]' });
      });
  }
});
