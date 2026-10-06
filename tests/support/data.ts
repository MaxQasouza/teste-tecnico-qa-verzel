/**
 * Massa de dados fixa, conforme a seção "Dados para teste" da documentação.
 * Produtos, preços e cupons são iguais para todos os candidatos e não mudam.
 */
export const PRODUTOS = {
  CAMISETA: { id: 'P001', nome: 'Camiseta Essencial', preco: 59.9 },
  CALCA: { id: 'P002', nome: 'Calça Jeans Slim', preco: 139.9 },
  TENIS: { id: 'P003', nome: 'Tênis Casual Urbano', preco: 189.9 },
  BONE: { id: 'P004', nome: 'Boné Aba Curva', preco: 49.9 },
  MOCHILA: { id: 'P005', nome: 'Mochila Urbana 20L', preco: 100 },
  MEIAS: { id: 'P006', nome: 'Kit 3 Pares de Meias', preco: 29.9 },
  JAQUETA: { id: 'P007', nome: 'Jaqueta Corta-Vento', preco: 229.9 },
  GARRAFA: { id: 'P008', nome: 'Garrafa Térmica 750ml', preco: 50 },
} as const;

export type Produto = (typeof PRODUTOS)[keyof typeof PRODUTOS];

export const CUPONS = {
  VALIDO: 'BEMVINDO10',
  EXPIRADO: 'VERAO2026',
  INEXISTENTE: 'CUPOMFAKE99',
} as const;

export const REGRAS = {
  FRETE_FIXO: 19.9,
  LIMITE_FRETE_GRATIS: 200,
  PERCENTUAL_CUPOM: 0.1,
  QUANTIDADE_MAXIMA: 5,
} as const;

export const MENSAGENS = {
  CUPOM_APLICADO: 'Cupom aplicado: 10% de desconto nos produtos.',
  CUPOM_INVALIDO: 'Cupom inválido.',
  CUPOM_EXPIRADO: 'Cupom expirado.',
  CUPOM_VAZIO: 'Informe um cupom.',
  LIMITE_VITRINE: 'Limite de 5 unidades atingido.',
  LIMITE_CARRINHO: 'Limite de 5 unidades por produto.',
  NOME_OBRIGATORIO: 'Informe o nome completo.',
  NOME_SEM_SOBRENOME: 'Informe nome e sobrenome.',
  EMAIL_OBRIGATORIO: 'Informe o e-mail.',
  EMAIL_INVALIDO: 'Informe um e-mail válido.',
  CEP_OBRIGATORIO: 'Informe o CEP.',
  CEP_INVALIDO: 'Informe um CEP com 8 dígitos.',
} as const;

export const CLIENTE_VALIDO = {
  nome: 'Maria Silva',
  email: 'maria@exemplo.com',
  cep: '01310-100',
} as const;

/** Formato do número do pedido documentado: VZ-000000. */
export const NUMERO_PEDIDO_REGEX = /^VZ-\d{6}$/;

/** Bugs abertos, usados no `test.fixme()` e na anotação `bug` dos testes (docs/report-de-bugs.md). */
export const BUGS = {
  FRETE_200: 'BUG-001: frete cobrado com subtotal exatamente R$ 200,00 (CA06)',
  QUANTIDADE_API: 'BUG-002: API aceita mais de 5 unidades por produto (CA10)',
  ITEM_INVALIDO: 'BUG-003: item sem produtoId/quantidade não retorna ITEM_INVALIDO',
} as const;
