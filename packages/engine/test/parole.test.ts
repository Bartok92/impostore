import { describe, expect, it } from 'vitest';
import { CATEGORIE, idCoppia, normalizzaParola } from '../src/index.js';

// Controlli sulle liste di parole: niente doppioni, coppie davvero diverse, abbastanza parole per categoria.

describe('le liste di parole', () => {
  it('ogni categoria ha circa 100 coppie (almeno 80)', () => {
    for (const c of CATEGORIE) expect(c.coppie.length, c.nome).toBeGreaterThanOrEqual(80);
  });

  it('nessuna parola compare due volte nella stessa categoria', () => {
    for (const c of CATEGORIE) {
      const viste = new Map<string, number>();
      for (const [a, b] of c.coppie) for (const p of [a, b]) viste.set(normalizzaParola(p), (viste.get(normalizzaParola(p)) ?? 0) + 1);
      const doppie = [...viste].filter(([, n]) => n > 1).map(([p]) => p);
      expect(doppie, c.nome).toEqual([]);
    }
  });

  it('le due parole di una coppia sono diverse e non vuote; nessuna svela i ruoli', () => {
    for (const c of CATEGORIE) {
      for (const [a, b] of c.coppie) {
        expect(a.trim() && b.trim(), `${c.nome}: ${a}/${b}`).toBeTruthy();
        expect(normalizzaParola(a), `${c.nome}: ${a}/${b}`).not.toBe(normalizzaParola(b));
        for (const p of [a, b]) expect(normalizzaParola(p), p).not.toMatch(/detective|impostor|mrwhite/);
      }
    }
  });

  it('ogni coppia ha un identificativo unico', () => {
    const ids = CATEGORIE.flatMap((c) => c.coppie.map((x) => idCoppia(c.id, x)));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
