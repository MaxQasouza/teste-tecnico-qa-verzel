import { Locator, Page } from '@playwright/test';
import { ResumoComponent } from './resumo.component';

export class ConfirmacaoPage {
  readonly resumo: ResumoComponent;
  readonly selo: Locator;
  readonly numeroPedido: Locator;
  readonly continuarComprando: Locator;

  constructor(private readonly page: Page) {
    this.resumo = new ResumoComponent(page);
    this.selo = page.getByText('Pedido confirmado');
    this.numeroPedido = page.getByRole('heading', { level: 1 }).locator('.numero-pedido');
    this.continuarComprando = page.getByRole('link', { name: 'Continuar comprando' });
  }

  async aguardar(): Promise<void> {
    await this.page.waitForURL('**/pedido-confirmado');
    await this.selo.waitFor();
  }
}
