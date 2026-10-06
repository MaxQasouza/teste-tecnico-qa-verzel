import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://verzel-store.qa-test-verzel-store.workers.dev';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // O ambiente é remoto e compartilhado: o retry absorve oscilações de rede, e o relatório marca o teste como "flaky".
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // allure-playwright 3.x chama a pasta de saída de `resultsDir` (o antigo `outputFolder` é ignorado).
    ['allure-playwright', {
      resultsDir: 'allure-results',
      environmentInfo: { Card: 'VZS-142 (v2.3.0)', Ambiente: BASE_URL, Node: process.version },
    }],
  ],
  use: {
    baseURL: BASE_URL,
    // Os valores do resumo usam o atributo data-valor (subtotal, desconto, frete, total).
    testIdAttribute: 'data-valor',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { extraHTTPHeaders: { 'Content-Type': 'application/json' } },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
