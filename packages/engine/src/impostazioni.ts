import { ID_CATEGORIE, type SceltaCategoria } from './parole.js';

// Le modalità scelte dal Master in lobby (vedi RULES.md, "Modalità speciali").

export const MIN_GIOCATORI = 3;
export const MAX_GIOCATORI = 20;
export const MAX_IMPOSTORI = 6;
export const SECONDI_POSSIBILI = [15, 30, 45, 60] as const;

export interface Impostazioni {
  categoria: SceltaCategoria;
  impostori: number;
  mrWhite: boolean;
  inconsapevole: boolean;
  indiziATempo: boolean;
  secondiIndizio: number;
  doppioGiro: boolean;
}

export const IMPOSTAZIONI_INIZIALI: Impostazioni = {
  categoria: 'casuale',
  impostori: 1,
  mrWhite: false,
  inconsapevole: false,
  indiziATempo: false,
  secondiIndizio: 30,
  doppioGiro: false,
};

/** Unisce una modifica (arrivata dalla rete: non ci si fida) alle impostazioni attuali. */
export function aggiornaImpostazioni(attuali: Impostazioni, modifica: unknown): Impostazioni {
  const m = (modifica && typeof modifica === 'object' ? modifica : {}) as Record<string, unknown>;
  const bool = (k: keyof Impostazioni) => (typeof m[k] === 'boolean' ? (m[k] as boolean) : (attuali[k] as boolean));
  const categoria =
    typeof m.categoria === 'string' && (m.categoria === 'casuale' || (ID_CATEGORIE as string[]).includes(m.categoria))
      ? (m.categoria as SceltaCategoria)
      : attuali.categoria;
  const impostori =
    typeof m.impostori === 'number' && Number.isInteger(m.impostori) ? Math.min(MAX_IMPOSTORI, Math.max(0, m.impostori)) : attuali.impostori;
  const secondiIndizio =
    typeof m.secondiIndizio === 'number' && (SECONDI_POSSIBILI as readonly number[]).includes(m.secondiIndizio) ? m.secondiIndizio : attuali.secondiIndizio;
  return {
    categoria,
    impostori,
    mrWhite: bool('mrWhite'),
    inconsapevole: bool('inconsapevole'),
    indiziATempo: bool('indiziATempo'),
    secondiIndizio,
    doppioGiro: bool('doppioGiro'),
  };
}

export interface Composizione {
  detective: number;
  impostori: number;
  mrWhite: number;
}

export function composizione(giocatori: number, imp: Impostazioni): Composizione {
  const mrWhite = imp.mrWhite ? 1 : 0;
  return { detective: giocatori - imp.impostori - mrWhite, impostori: imp.impostori, mrWhite };
}

/** Quanti infiltrati (impostori + Mr. White) al massimo con questi giocatori: i detective devono restare la maggioranza. */
export function maxInfiltrati(giocatori: number): number {
  return Math.max(0, Math.min(giocatori - 2, Math.ceil(giocatori / 2) - 1));
}

/** Perché non si può ancora iniziare (vuoto = si può). */
export function problemiComposizione(giocatori: number, imp: Impostazioni): string[] {
  if (giocatori < MIN_GIOCATORI) return [`Servono almeno ${MIN_GIOCATORI} giocatori (ora ${giocatori}).`];
  const c = composizione(giocatori, imp);
  const infiltrati = c.impostori + c.mrWhite;
  if (infiltrati === 0) return ['Serve almeno un impostore oppure Mr. White.'];
  if (infiltrati > maxInfiltrati(giocatori)) {
    return [`Con ${giocatori} giocatori al massimo ${maxInfiltrati(giocatori)} tra impostori e Mr. White: i detective devono essere la maggioranza.`];
  }
  return [];
}
