import { Locator, Page } from '@playwright/test';
import { ResumoComponent } from './resumo.component';

export interface DadosCliente {
  nome: string;
  email: string;
  cep: string;
}

export class CheckoutPage {
  readonly resumo: ResumoComponent;
  readonly campoNome: Locator;
  readonly campoEmail: Locator;
  readonly campoCep: Locator;
  readonly botaoConfirmar: Locator;

  constructor(private readonly page: Page) {
    this.resumo = new ResumoComponent(page);
    this.campoNome = page.getByLabel('Nome completo');
    this.campoEmail = page.getByLabel('E-mail');
    this.campoCep = page.getByLabel('CEP');
    this.botaoConfirmar = page.getByRole('button', { name: 'Confirmar pedido' });
  }

  async abrir(): Promise<void> {
    await this.page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await this.page.getByRole('heading', { name: 'Finalizar compra' }).waitFor();
  }

  async preencher({ nome, email, cep }: DadosCliente): Promise<void> {
    await this.campoNome.fill(nome);
    await this.campoEmail.fill(email);
    await this.campoCep.fill(cep);
  }

  async confirmar(dados: DadosCliente): Promise<void> {
    await this.preencher(dados);
    await this.botaoConfirmar.click();
  }

  /** Mensagem de erro associada ao campo via aria-describedby. */
  erroDoCampo(campo: Locator): Locator {
    return this.page.locator('.campo').filter({ has: campo }).locator('.mensagem-erro');
  }

  mensagemGeral(texto: string): Locator {
    return this.page.getByText(texto, { exact: true });
  }
}
