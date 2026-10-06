import { APIRequestContext, APIResponse } from '@playwright/test';
import { REGRAS } from './data';
import { arredondar } from './money';

export interface ItemRequest {
  produtoId: string;
  quantidade: number;
}

export interface ClienteRequest {
  nome: string;
  email: string;
  cep: string;
}

export interface ResumoCarrinho {
  itens: Array<{ produtoId: string; nome: string; precoUnitario: number; quantidade: number; total: number }>;
  subtotal: number;
  desconto: number;
  frete: number;
  freteGratis: boolean;
  valorFaltanteFreteGratis: number;
  total: number;
  cupom: { codigo: string; aplicado: boolean; mensagem: string } | null;
}

export interface Pedido extends ResumoCarrinho {
  numero: string;
  criadoEm: string;
  cliente: ClienteRequest;
}

export interface ErroApi {
  erro: {
    codigo: string;
    mensagem: string;
    campo?: string;
    campos?: Array<{ campo: string; mensagem: string }>;
  };
}

/** Cliente fino sobre o `request` do Playwright para a API da Verzel Store. */
export class VerzelApi {
  constructor(private readonly request: APIRequestContext) {}

  listarProdutos(): Promise<APIResponse> {
    return this.request.get('/api/produtos');
  }

  consultarProduto(id: string): Promise<APIResponse> {
    return this.request.get(`/api/produtos/${id}`);
  }

  calcularCarrinho(body: unknown): Promise<APIResponse> {
    return this.request.post('/api/carrinho/calcular', { data: body });
  }

  criarPedido(body: unknown): Promise<APIResponse> {
    return this.request.post('/api/pedidos', { data: body });
  }

  /** Envia o corpo cru, sem serializar, para testar JSON malformado. */
  postBruto(path: string, corpo: string): Promise<APIResponse> {
    return this.request.post(path, { data: corpo, headers: { 'Content-Type': 'application/json' } });
  }
}

/** Oráculo: calcula o resumo esperado a partir das regras documentadas (CA01, CA06-CA09, CA11). */
export function resumoEsperado(itens: Array<{ preco: number; quantidade: number }>, comCupomValido = false) {
  const subtotal = arredondar(itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0));
  const desconto = comCupomValido ? arredondar(subtotal * REGRAS.PERCENTUAL_CUPOM) : 0;
  const freteGratis = subtotal >= REGRAS.LIMITE_FRETE_GRATIS;
  const frete = freteGratis ? 0 : REGRAS.FRETE_FIXO;
  return {
    subtotal,
    desconto,
    frete,
    freteGratis,
    valorFaltanteFreteGratis: arredondar(Math.max(0, REGRAS.LIMITE_FRETE_GRATIS - subtotal)),
    total: arredondar(subtotal - desconto + frete),
  };
}
