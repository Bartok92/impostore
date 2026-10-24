import { IMPOSTAZIONI_INIZIALI, type Impostazioni } from './impostazioni.js';
import type { IdCategoria } from './parole.js';
import type { Fase, IdGiocatore, Ruolo } from './tipi.js';

// Lo stato completo della stanza. Contiene i segreti (ruoli e parole):
// esce da chi ospita solo attraverso `vistaPer`, che filtra per ogni giocatore.

export interface Giocatore {
  id: IdGiocatore;
  nome: string;
}

export interface Indizio {
  id: IdGiocatore;
  giro: number;
  passaggio: number;
  /** null: detto a voce, tempo scaduto o turno saltato. */
  testo: string | null;
  esito: 'scritto' | 'aVoce' | 'tempo' | 'saltato';
}

export interface Eliminazione {
  id: IdGiocatore;
  giro: number;
  ruolo: Ruolo;
}

export interface Verdetto {
  giro: number;
  /** Era una votazione di ballottaggio? */
  ballottaggio: boolean;
  /** Voti ricevuti, dal più votato. */
  conteggio: { id: IdGiocatore; voti: number }[];
  /** Chi ha votato chi (pubblico dopo il verdetto). */
  voti: Record<IdGiocatore, IdGiocatore>;
  esito: 'eliminato' | 'pareggio';
  eliminato: IdGiocatore | null;
  ruolo: Ruolo | null;
  /** Pareggio: i giocatori a pari voti. */
  pari: IdGiocatore[];
  /** Tentativo di Mr. White, se è stato eliminato lui. */
  tentativo: { testo: string; esatto: boolean } | null;
}

export type Squadra = 'detective' | 'infiltrati' | 'mrwhite';

export interface Vittoria {
  squadra: Squadra;
  vincitori: IdGiocatore[];
  punti: Record<IdGiocatore, number>;
}

export interface Partita {
  numero: number;
  /** Le modalità valgono per tutta la partita, anche se in lobby si cambiano dopo. */
  impostazioni: Impostazioni;
  categoria: IdCategoria;
  coppia: string;
  parolaDetective: string;
  parolaImpostore: string;
  ruoli: Record<IdGiocatore, Ruolo>;
  /** Giro del tavolo (sorteggiato). */
  ordine: IdGiocatore[];
  eliminati: Eliminazione[];
  /** Chi ha già visto la propria carta. */
  visto: IdGiocatore[];
  /** Giro = indizi + votazione. Parte da 1. */
  giro: number;
  /** 1, oppure 2 con il doppio giro. */
  passaggio: number;
  /** Chi parla in questo giro, nell'ordine. */
  parlanti: IdGiocatore[];
  turno: number;
  /** Quando scade il turno (indizio o tentativo di Mr. White), sull'orologio di chi ospita. */
  fineTurnoA: number | null;
  indizi: Indizio[];
  voti: Record<IdGiocatore, IdGiocatore>;
  /** Ballottaggio in corso (o appena deciso dal pareggio). */
  candidati: IdGiocatore[] | null;
  verdetto: Verdetto | null;
  vittoria: Vittoria | null;
}

export interface StatoStanza {
  fase: Fase;
  idMaster: IdGiocatore | null;
  giocatori: Giocatore[];
  impostazioni: Impostazioni;
  /** Classifica della stanza. */
  punti: Record<IdGiocatore, number>;
  partiteGiocate: number;
  coppieUsate: string[];
  partita: Partita | null;
}

export function creaStato(): StatoStanza {
  return {
    fase: 'lobby',
    idMaster: null,
    giocatori: [],
    impostazioni: { ...IMPOSTAZIONI_INIZIALI },
    punti: {},
    partiteGiocate: 0,
    coppieUsate: [],
    partita: null,
  };
}

export function inGioco(p: Partita, id: IdGiocatore): boolean {
  return id in p.ruoli && !p.eliminati.some((e) => e.id === id);
}

/** Giocatori ancora in gioco, nel giro del tavolo. */
export function viviDi(p: Partita): IdGiocatore[] {
  return p.ordine.filter((id) => inGioco(p, id));
}

/** La parola che vede chi ha questo ruolo. */
export function parolaDi(p: Partita, ruolo: Ruolo): string | null {
  if (ruolo === 'detective') return p.parolaDetective;
  if (ruolo === 'impostore') return p.parolaImpostore;
  return null;
}
