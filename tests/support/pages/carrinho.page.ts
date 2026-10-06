import { Locator, Page } from '@playwright/test';
import { Produto } from '../data';
import { ResumoComponent } from './resumo.component';

export class CarrinhoPage {
  readonly resumo: ResumoComponent;
  readonly campoCupom: Locator;
  readonly botaoAplicarCupom: Locator;
  readonly botaoRemoverCupom: Locator;
  readonly cupomAplicado: Locator;
  readonly botaoFinalizar: Locator;
  readonly botaoEsvaziar: Locator;
  readonly carrinhoVazio: Locator;

  constructor(private readonly page: Page) {
    this.resumo = new ResumoComponent(page);
    this.campoCupom = page.getByLabel('Cupom de desconto');
    this.botaoAplicarCupom = page.getByRole('button', { name: 'Aplicar cupom' });
    this.botaoRemoverCupom = page.getByRole('button', { name: 'Remover cupom' });
    this.cupomAplicado = page.getByText(/^Cupom .+ aplicado\.$/);
    this.botaoFinalizar = page.getByRole('link', { name: 'Finalizar compra' });
    this.botaoEsvaziar = page.getByRole('button', { name: 'Esvaziar carrinho' });
    this.carrinhoVazio = page.getByText('Seu carrinho está vazio');
  }

  async abrir(): Promise<void> {
    await this.page.goto('/carrinho', { waitUntil: 'domcontentloaded' });
    await this.page.getByRole('heading', { name: 'Carrinho', level: 1 }).or(this.carrinhoVazio).first().waitFor();
  }

  quantidade(produto: Produto): Locator {
    // <output> tem papel implícito "status".
    return this.page.getByRole('status', { name: `Quantidade de ${produto.nome}` });
  }

  botaoAumentar(produto: Produto): Locator {
    return this.page.getByRole('button', { name: `Aumentar quantidade de ${produto.nome}` });
  }

  botaoDiminuir(produto: Produto): Locator {
    return this.page.getByRole('button', { name: `Diminuir quantidade de ${produto.nome}` });
  }

  botaoRemover(produto: Produto): Locator {
    return this.page.getByRole('button', { name: `Remover ${produto.nome} do carrinho` });
  }

  /** Mensagem de retorno do cupom (sucesso ou erro) exibida abaixo do campo. */
  mensagemCupom(texto: string): Locator {
    return this.page.getByText(texto, { exact: true });
  }

  /**
   * Aplica o cupom e aguarda a validação na API, para que as asserções não disputem
   * com a latência do ambiente. Cupom em branco é barrado na interface, sem chamada.
   */
  async aplicarCupom(codigo: string): Promise<void> {
    await this.campoCupom.fill(codigo);
    if (!codigo.trim()) {
      await this.botaoAplicarCupom.click();
      return;
    }
    const validacao = this.page.waitForResponse(r =>
      r.url().endsWith('/api/carrinho/calcular') && !!r.request().postDataJSON()?.cupom);
    await this.botaoAplicarCupom.click();
    await validacao;
  }

  async finalizarCompra(): Promise<void> {
    await this.botaoFinalizar.click();
    await this.page.waitForURL('**/checkout');
  }
}
