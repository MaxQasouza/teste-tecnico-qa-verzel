/**
 * Coleta as evidências dos bugs do report (docs/report-de-bugs.md) em docs/evidencias/:
 *  - api-logs/BUG-XXX-*.json  -> request + response (status, headers e corpo)
 *  - screenshots/BUG-XXX-*.png -> telas da interface no momento do defeito
 *
 * Uso: npm run evidencias   (ou BASE_URL=... npm run evidencias)
 */
import { chromium, request } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = process.env.BASE_URL ?? 'https://verzel-store.qa-test-verzel-store.workers.dev';
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'evidencias');
const LOGS = join(DIR, 'api-logs');
const PRINTS = join(DIR, 'screenshots');
const CLIENTE = { nome: 'Maria Silva', email: 'maria@exemplo.com', cep: '01310-100' };

await mkdir(LOGS, { recursive: true });
await mkdir(PRINTS, { recursive: true });

// ---------- API ----------
const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { 'Content-Type': 'application/json' } });

async function registrar(arquivo, metodo, rota, corpo) {
  const resposta = await api.fetch(rota, { method: metodo, data: corpo });
  const log = {
    coletadoEm: new Date().toISOString(),
    request: { metodo, url: `${BASE_URL}${rota}`, corpo },
    response: { status: resposta.status(), contentType: resposta.headers()['content-type'], corpo: await resposta.json() },
  };
  await writeFile(join(LOGS, arquivo), JSON.stringify(log, null, 2) + '\n', 'utf8');
  console.log(`  ${arquivo} -> ${resposta.status()}`);
}

console.log('API logs:');
await registrar('BUG-001-calcular-subtotal-200.json', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P005', quantidade: 2 }] });
await registrar('BUG-001-calcular-subtotal-200-com-cupom.json', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P008', quantidade: 4 }], cupom: 'BEMVINDO10' });
await registrar('BUG-001-pedido-subtotal-200.json', 'POST', '/api/pedidos', { cliente: CLIENTE, itens: [{ produtoId: 'P005', quantidade: 1 }, { produtoId: 'P008', quantidade: 2 }] });
await registrar('BUG-001-controle-subtotal-219_80.json', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P003', quantidade: 1 }, { produtoId: 'P006', quantidade: 1 }] });
await registrar('BUG-002-calcular-quantidade-6.json', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P001', quantidade: 6 }] });
await registrar('BUG-002-calcular-quantidade-100.json', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P001', quantidade: 100 }] });
await registrar('BUG-002-pedido-quantidade-6.json', 'POST', '/api/pedidos', { cliente: CLIENTE, itens: [{ produtoId: 'P005', quantidade: 6 }] });
await registrar('BUG-003-item-sem-produtoId.json', 'POST', '/api/carrinho/calcular', { itens: [{ quantidade: 1 }] });
await registrar('BUG-003-item-sem-quantidade.json', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P001' }] });
await registrar('BUG-003-controle-item-nao-objeto.json', 'POST', '/api/carrinho/calcular', { itens: ['P001'] });
await api.dispose();

// ---------- UI ----------
const browser = await chromium.launch();

async function novaAba(itens, cupom = null) {
  const contexto = await browser.newContext({ baseURL: BASE_URL, locale: 'pt-BR', viewport: { width: 1280, height: 900 } });
  const page = await contexto.newPage();
  await page.addInitScript(({ itens, cupom }) => {
    if (sessionStorage.getItem('__semeado')) return;
    sessionStorage.setItem('verzel-store:itens', JSON.stringify(itens));
    sessionStorage.setItem('verzel-store:cupom', JSON.stringify(cupom));
    sessionStorage.setItem('__semeado', '1');
  }, { itens, cupom });
  return page;
}

async function print(page, arquivo) {
  await page.screenshot({ path: join(PRINTS, arquivo), fullPage: true });
  console.log(`  ${arquivo}`);
}

console.log('Screenshots:');
{
  // BUG-001 pelo fluxo real da vitrine: 2 x Mochila (R$ 100,00) = R$ 200,00
  const page = await novaAba([]);
  await page.goto('/');
  const mochila = page.getByRole('article', { name: 'Mochila Urbana 20L' });
  await mochila.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await mochila.getByText('1 no carrinho').waitFor();
  await mochila.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await mochila.getByText('2 no carrinho').waitFor();
  await page.goto('/carrinho');
  await page.getByText('Faltam').waitFor();
  await print(page, 'BUG-001-carrinho-subtotal-200-cobra-frete.png');

  await page.getByLabel('Cupom de desconto').fill('BEMVINDO10');
  await page.getByRole('button', { name: 'Aplicar cupom' }).click();
  await page.getByText('Cupom BEMVINDO10 aplicado.').waitFor();
  await print(page, 'BUG-001-carrinho-subtotal-200-com-cupom.png');

  await page.getByRole('link', { name: 'Finalizar compra' }).click();
  await page.getByLabel('Nome completo').fill(CLIENTE.nome);
  await page.getByLabel('E-mail').fill(CLIENTE.email);
  await page.getByLabel('CEP').fill(CLIENTE.cep);
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await page.getByText('Pedido confirmado').waitFor();
  await print(page, 'BUG-001-pedido-confirmado-com-frete.png');
  await page.context().close();
}
{
  // BUG-002: carrinho manipulado com 6 unidades chega ao pedido confirmado
  const page = await novaAba([{ produtoId: 'P001', quantidade: 6 }]);
  await page.goto('/carrinho');
  await page.getByText('R$ 359,40').first().waitFor();
  await print(page, 'BUG-002-carrinho-6-unidades.png');

  await page.getByRole('link', { name: 'Finalizar compra' }).click();
  await page.getByLabel('Nome completo').fill(CLIENTE.nome);
  await page.getByLabel('E-mail').fill(CLIENTE.email);
  await page.getByLabel('CEP').fill(CLIENTE.cep);
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await page.getByText('Pedido confirmado').waitFor();
  await print(page, 'BUG-002-pedido-confirmado-6-unidades.png');
  await page.context().close();
}
{
  // Controle: comportamento correto da vitrine no limite de 5 unidades
  const page = await novaAba([]);
  await page.goto('/');
  const camiseta = page.getByRole('article', { name: 'Camiseta Essencial' });
  for (let i = 1; i <= 5; i++) {
    await camiseta.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await camiseta.getByText(i < 5 ? `${i} no carrinho` : 'Limite de 5 unidades atingido.').waitFor();
  }
  await print(page, 'CONTROLE-vitrine-limite-5-unidades.png');
  await page.context().close();
}

await browser.close();
console.log('Evidências salvas em', DIR);
