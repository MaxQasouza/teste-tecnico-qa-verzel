import { test as base, expect } from '@playwright/test';
import { VerzelApi, ItemRequest } from './api-client';
import { CarrinhoPage } from './pages/carrinho.page';
import { CheckoutPage } from './pages/checkout.page';
import { ConfirmacaoPage } from './pages/confirmacao.page';
import { VitrinePage } from './pages/vitrine.page';

const CHAVE_ITENS = 'verzel-store:itens';
const CHAVE_CUPOM = 'verzel-store:cupom';

type Fixtures = {
  api: VerzelApi;
  vitrine: VitrinePage;
  carrinho: CarrinhoPage;
  checkout: CheckoutPage;
  confirmacao: ConfirmacaoPage;
  /**
   * Pré-carrega o carrinho no sessionStorage (onde a aplicação o guarda).
   * Usado como atalho de setup e para simular manipulação do cliente;
   * os fluxos principais adicionam itens pela própria interface.
   */
  semearCarrinho: (itens: ItemRequest[], cupom?: string | null) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => use(new VerzelApi(request)),
  vitrine: async ({ page }, use) => use(new VitrinePage(page)),
  carrinho: async ({ page }, use) => use(new CarrinhoPage(page)),
  checkout: async ({ page }, use) => use(new CheckoutPage(page)),
  confirmacao: async ({ page }, use) => use(new ConfirmacaoPage(page)),
  semearCarrinho: async ({ page }, use) => {
    await use(async (itens, cupom = null) => {
      await page.addInitScript(
        ({ itens, cupom, chaveItens, chaveCupom }) => {
          // Semeia só na primeira carga para não sobrescrever as ações do teste.
          if (sessionStorage.getItem('__semeado')) return;
          sessionStorage.setItem(chaveItens, JSON.stringify(itens));
          sessionStorage.setItem(chaveCupom, JSON.stringify(cupom));
          sessionStorage.setItem('__semeado', '1');
        },
        { itens, cupom, chaveItens: CHAVE_ITENS, chaveCupom: CHAVE_CUPOM },
      );
    });
  },
});

/**
 * Liga a execução dos testes que reproduzem bugs abertos (docs/report-de-bugs.md).
 * Sem a variável, esses testes ficam como `fixme` (pulados, com o ID do bug no relatório)
 * e a suíte passa. Com EXPOR_BUGS=1 (`npm run test:bugs`) eles rodam e falham com
 * screenshot, vídeo e trace, mostrando o defeito.
 */
export const EXPOR_BUGS = !!process.env.EXPOR_BUGS;

export { expect };
