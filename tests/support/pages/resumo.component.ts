import { Locator, Page } from '@playwright/test';

/** Bloco "Resumo do pedido", presente no carrinho, no checkout e na confirmação. */
export class ResumoComponent {
  readonly subtotal: Locator;
  readonly desconto: Locator;
  readonly rotuloDesconto: Locator;
  readonly frete: Locator;
  readonly total: Locator;
  readonly avisoFrete: Locator;

  constructor(page: Page) {
    // testIdAttribute = data-valor (playwright.config.ts)
    this.subtotal = page.getByTestId('subtotal');
    this.desconto = page.getByTestId('desconto');
    this.rotuloDesconto = page.locator('dt', { hasText: 'Desconto' });
    this.frete = page.getByTestId('frete');
    this.total = page.getByTestId('total');
    this.avisoFrete = page.getByText(/Faltam R\$ .* para o frete grátis\./);
  }
}
