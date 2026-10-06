const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Arredondamento comercial para 2 casas decimais (CA11). */
export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function casasDecimais(valor: number): number {
  return String(valor).split('.')[1]?.length ?? 0;
}

/** Formata como na interface: "R$ 1.234,56" (com espaço comum no lugar do NBSP). */
export function brl(valor: number): string {
  return formatter.format(valor).replace(/ /g, ' ');
}

/** Converte "R$ 1.234,56" / "- R$ 10,00" em número. */
export function parseBrl(texto: string): number {
  const negativo = texto.trim().startsWith('-');
  const numero = Number(texto.replace(/[^\d,]/g, '').replace(',', '.'));
  return negativo ? -numero : numero;
}
