import { test, expect, EXPOR_BUGS } from '../support/fixtures';
import { ErroApi } from '../support/api-client';
import { BUGS, CLIENTE_VALIDO, CUPONS, MENSAGENS, NUMERO_PEDIDO_REGEX, PRODUTOS } from '../support/data';

const umaMochila = [{ produtoId: PRODUTOS.MOCHILA.id, quantidade: 1 }];

test.describe('API POST /api/pedidos', { tag: '@api' }, () => {
  test('CT-35 pedido válido com cupom responde 201 com número VZ-000000 e o resumo de valores', async ({ api }) => {
    const resposta = await api.criarPedido({ cliente: CLIENTE_VALIDO, itens: umaMochila, cupom: CUPONS.VALIDO });

    expect(resposta.status()).toBe(201);
    const pedido = await resposta.json();
    expect(pedido).toMatchObject({
      numero: expect.stringMatching(NUMERO_PEDIDO_REGEX),
      cliente: { nome: 'Maria Silva', email: 'maria@exemplo.com', cep: '01310100' },
      subtotal: 100,
      desconto: 10,
      frete: 19.9,
      freteGratis: false,
      valorFaltanteFreteGratis: 100,
      total: 109.9,
      cupom: { codigo: CUPONS.VALIDO, aplicado: true },
    });
    expect(new Date(pedido.criadoEm).toString()).not.toBe('Invalid Date');
  });

  test('CT-07 cupom com espaços e minúsculas também é aceito no pedido (CA02)', async ({ api }) => {
    const resposta = await api.criarPedido({ cliente: CLIENTE_VALIDO, itens: umaMochila, cupom: '  bemvindo10 ' });

    expect(resposta.status()).toBe(201);
    expect((await resposta.json()).cupom).toMatchObject({ codigo: CUPONS.VALIDO, aplicado: true });
  });

  const cuponsRecusados = [
    { codigo: CUPONS.INEXISTENTE, erro: 'CUPOM_INVALIDO', mensagem: MENSAGENS.CUPOM_INVALIDO },
    { codigo: CUPONS.EXPIRADO, erro: 'CUPOM_EXPIRADO', mensagem: MENSAGENS.CUPOM_EXPIRADO },
  ];
  for (const { codigo, erro, mensagem } of cuponsRecusados) {
    test(`CT-12 pedido com cupom ${codigo} responde 422 ${erro}`, async ({ api }) => {
      const resposta = await api.criarPedido({ cliente: CLIENTE_VALIDO, itens: umaMochila, cupom: codigo });

      expect(resposta.status()).toBe(422);
      expect(await resposta.json()).toEqual({ erro: { codigo: erro, mensagem, campo: 'cupom' } });
    });
  }

  test('CT-28 cliente ausente responde 422 DADOS_INVALIDOS listando todos os campos', async ({ api }) => {
    const resposta = await api.criarPedido({ itens: umaMochila });

    expect(resposta.status()).toBe(422);
    const { erro } = (await resposta.json()) as ErroApi;
    expect(erro.codigo).toBe('DADOS_INVALIDOS');
    expect(erro.campos).toEqual([
      { campo: 'cliente.nome', mensagem: MENSAGENS.NOME_OBRIGATORIO },
      { campo: 'cliente.email', mensagem: MENSAGENS.EMAIL_OBRIGATORIO },
      { campo: 'cliente.cep', mensagem: MENSAGENS.CEP_OBRIGATORIO },
    ]);
  });

  const dadosInvalidos = [
    { id: 'CT-24', campo: 'cliente.nome', cliente: { ...CLIENTE_VALIDO, nome: 'Maria' }, mensagem: MENSAGENS.NOME_SEM_SOBRENOME },
    { id: 'CT-24', campo: 'cliente.nome', cliente: { ...CLIENTE_VALIDO, nome: '   Maria   ' }, mensagem: MENSAGENS.NOME_SEM_SOBRENOME },
    { id: 'CT-24', campo: 'cliente.nome', cliente: { ...CLIENTE_VALIDO, nome: 'Maria S' }, mensagem: MENSAGENS.NOME_SEM_SOBRENOME },
    { id: 'CT-25', campo: 'cliente.email', cliente: { ...CLIENTE_VALIDO, email: 'maria@' }, mensagem: MENSAGENS.EMAIL_INVALIDO },
    { id: 'CT-25', campo: 'cliente.email', cliente: { ...CLIENTE_VALIDO, email: 'maria silva@exemplo.com' }, mensagem: MENSAGENS.EMAIL_INVALIDO },
    { id: 'CT-25', campo: 'cliente.email', cliente: { ...CLIENTE_VALIDO, email: 'maria@exemplo' }, mensagem: MENSAGENS.EMAIL_INVALIDO },
    { id: 'CT-25', campo: 'cliente.email', cliente: { ...CLIENTE_VALIDO, email: 'maria.exemplo.com' }, mensagem: MENSAGENS.EMAIL_INVALIDO },
    { id: 'CT-26', campo: 'cliente.cep', cliente: { ...CLIENTE_VALIDO, cep: '0131010' }, mensagem: MENSAGENS.CEP_INVALIDO },
    { id: 'CT-26', campo: 'cliente.cep', cliente: { ...CLIENTE_VALIDO, cep: '01.310-100' }, mensagem: MENSAGENS.CEP_INVALIDO },
    { id: 'CT-26', campo: 'cliente.cep', cliente: { ...CLIENTE_VALIDO, cep: '013101000' }, mensagem: MENSAGENS.CEP_INVALIDO },
    { id: 'CT-26', campo: 'cliente.cep', cliente: { ...CLIENTE_VALIDO, cep: 'ABCDE-FGH' }, mensagem: MENSAGENS.CEP_INVALIDO },
    { id: 'CT-26', campo: 'cliente.cep', cliente: { ...CLIENTE_VALIDO, cep: '01310 100' }, mensagem: MENSAGENS.CEP_INVALIDO },
  ];
  for (const { id, campo, cliente, mensagem } of dadosInvalidos) {
    test(`${id} ${campo}=${JSON.stringify(Object.values(cliente).join(' | '))} responde 422 DADOS_INVALIDOS`, async ({ api }) => {
      const resposta = await api.criarPedido({ cliente, itens: umaMochila });

      expect(resposta.status()).toBe(422);
      const { erro } = (await resposta.json()) as ErroApi;
      expect(erro).toMatchObject({ codigo: 'DADOS_INVALIDOS', campos: [{ campo, mensagem }] });
    });
  }

  test('CT-27 CEP sem hífen é aceito', async ({ api }) => {
    const resposta = await api.criarPedido({ cliente: { ...CLIENTE_VALIDO, cep: '01310100' }, itens: umaMochila });
    expect(resposta.status()).toBe(201);
  });

  test('CT-33 pedido sem itens responde 422 ITENS_OBRIGATORIOS', async ({ api }) => {
    const resposta = await api.criarPedido({ cliente: CLIENTE_VALIDO, itens: [] });

    expect(resposta.status()).toBe(422);
    expect((await resposta.json()).erro).toMatchObject({ codigo: 'ITENS_OBRIGATORIOS', campo: 'itens' });
  });

  test('CT-31 corpo inválido responde 400 JSON_INVALIDO', async ({ api }) => {
    const resposta = await api.postBruto('/api/pedidos', 'xx');

    expect(resposta.status()).toBe(400);
    expect((await resposta.json()).erro.codigo).toBe('JSON_INVALIDO');
  });

  test('CT-20 pedido com 6 unidades deve responder 422 QUANTIDADE_MAXIMA_EXCEDIDA (CA10)',
    { tag: '@bug', annotation: { type: 'bug', description: BUGS.QUANTIDADE_API } },
    async ({ api }) => {
      // BUG-002 aberto: a API não barra quantidade acima de 5. Pulado por padrão; roda e falha com EXPOR_BUGS=1.
      test.fixme(!EXPOR_BUGS, BUGS.QUANTIDADE_API);

      const resposta = await api.criarPedido({ cliente: CLIENTE_VALIDO, itens: [{ produtoId: PRODUTOS.MOCHILA.id, quantidade: 6 }] });

      expect(resposta.status()).toBe(422);
      expect((await resposta.json()).erro.codigo).toBe('QUANTIDADE_MAXIMA_EXCEDIDA');
    });

  test('CT-34 pedido com item sem produtoId deve responder 422 ITEM_INVALIDO',
    { tag: '@bug', annotation: { type: 'bug', description: BUGS.ITEM_INVALIDO } },
    async ({ api }) => {
      // BUG-003 aberto: item incompleto não retorna ITEM_INVALIDO. Pulado por padrão; roda e falha com EXPOR_BUGS=1.
      test.fixme(!EXPOR_BUGS, BUGS.ITEM_INVALIDO);

      const resposta = await api.criarPedido({ cliente: CLIENTE_VALIDO, itens: [{ quantidade: 1 }] });

      expect(resposta.status()).toBe(422);
      expect((await resposta.json()).erro).toMatchObject({ codigo: 'ITEM_INVALIDO', campo: 'itens[0]' });
    });

  test('CT-02 pedido com subtotal R$ 200,00 deve ter frete grátis (CA06)',
    { tag: '@bug', annotation: { type: 'bug', description: BUGS.FRETE_200 } },
    async ({ api }) => {
      // BUG-001 aberto: subtotal de R$ 200,00 ainda cobra frete. Pulado por padrão; roda e falha com EXPOR_BUGS=1.
      test.fixme(!EXPOR_BUGS, BUGS.FRETE_200);

      const resposta = await api.criarPedido({ cliente: CLIENTE_VALIDO, itens: [{ produtoId: PRODUTOS.GARRAFA.id, quantidade: 4 }] });

      expect(resposta.status()).toBe(201);
      expect(await resposta.json()).toMatchObject({ subtotal: 200, frete: 0, freteGratis: true, total: 200 });
    });
});
