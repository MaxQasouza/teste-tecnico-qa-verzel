import { Locator, Page } from '@playwright/test';
import { Produto } from '../data';

export class VitrinePage {
  readonly linkCarrinho: Locator;
  readonly contadorCarrinho: Locator;

  constructor(private readonly page: Page) {
    this.linkCarrinho = page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: /Carrinho/ });
    this.contadorCarrinho = page.getByLabel(/itens? no carrinho/);
  }

  async abrir(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.page.getByRole('heading', { name: 'Produtos', level: 2 }).waitFor();
  }

  /** Card do produto, localizado pelo nome acessível do <article>. */
  card(produto: Produto): Locator {
    return this.page.getByRole('article', { name: produto.nome });
  }

  botaoAdicionar(produto: Produto): Locator {
    return this.card(produto).getByRole('button', { name: 'Adicionar ao carrinho' });
  }

  aviso(produto: Produto): Locator {
    return this.card(produto).locator(`#aviso-${produto.id}`);
  }

  async adicionar(produto: Produto, quantidade = 1): Promise<void> {
    for (let i = 1; i <= quantidade; i++) {
      await this.botaoAdicionar(produto).click();
      // O aviso confirma que o estado do carrinho foi atualizado antes do próximo clique.
      await this.aviso(produto).filter({ hasText: /no carrinho|Limite/ }).waitFor();
    }
  }

  async irParaCarrinho(): Promise<void> {
    await this.linkCarrinho.click();
    await this.page.waitForURL('**/carrinho');
  }
}
