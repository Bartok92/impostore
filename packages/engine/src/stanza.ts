import { casualeSicuro } from './casuale.js';
import { applica, type Comando } from './comandi.js';
import type { PacchettoVista } from './eventi.js';
import { coppiaEsiste } from './parole.js';
import { creaStato, type StatoStanza } from './stato.js';
import { giocatore, SISTEMA, type Attore, type Casuale, type IdGiocatore } from './tipi.js';
import { vistaPer } from './viste.js';

// La "stanza" è la partita ospitata dal telefono del Master.
// Gestisce sessioni (riconnessione), il Master (che gioca anche lui) e la scadenza dei turni a tempo.
// Nessun I/O: rete e salvataggi sono compito di chi la ospita.

declare function btoa(s: string): string;

// Alfabeto senza caratteri ambigui (niente 0/O, 1/I/L): 31^5 ≈ 28 milioni di codici.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LUNGHEZZA_CODICE = 5;

export interface Sessione {
  token: string;
  idGiocatore: IdGiocatore;
  idDispositivo: string | null;
}

export interface AmbienteStanza {
  ora: () => number;
  casuale: () => Casuale;
}

export type EsitoEntra =
  | { ok: true; sessione: Sessione; nuovo: boolean; nickname: string }
  | { ok: false; errore: string };

export type EsitoComandoStanza = { ok: true; espulsi: IdGiocatore[] } | { ok: false; errore: string };

/** Byte casuali crittograficamente sicuri, in base64url (Web Crypto: Node ≥19 e browser). */
export function idCasuale(byte: number): string {
  const b = new Uint8Array(byte);
  (globalThis as unknown as { crypto: { getRandomValues(a: Uint8Array): void } }).crypto.getRandomValues(b);
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generaCodice(casuale: Casuale = casualeSicuro()): string {
  return Array.from({ length: LUNGHEZZA_CODICE }, () => ALFABETO[Math.floor(casuale() * ALFABETO.length)]).join('');
}

export function normalizzaCodice(codice: string): string {
  return codice.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Confronto a tempo costante (per i token). */
export function ugualeSicuro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const AMBIENTE_DEFAULT: AmbienteStanza = { ora: () => Date.now(), casuale: casualeSicuro };

export class Stanza {
  sessioni = new Map<string, Sessione>();
  creata: number;
  ultimaAttivita: number;
  private amb: AmbienteStanza;

  constructor(
    public codice: string,
    public tokenMaster: string,
    public stato: StatoStanza = creaStato(),
    amb: Partial<AmbienteStanza> = {},
  ) {
    this.amb = { ...AMBIENTE_DEFAULT, ...amb };
    this.creata = this.ultimaAttivita = this.amb.ora();
  }

  /** Stanza nuova con il Master già seduto al tavolo. */
  static nuova(nomeMaster: string, amb: Partial<AmbienteStanza> = {}, codice = generaCodice()): Stanza {
    const s = new Stanza(codice, idCasuale(32), creaStato(), amb);
    const r = s.comando(SISTEMA, { tipo: 'aggiungiGiocatore', id: `g_${idCasuale(6)}`, nome: nomeMaster, master: true });
    if (!r.ok) throw new Error(r.errore);
    return s;
  }

  get idMaster(): IdGiocatore {
    return this.stato.idMaster!;
  }

  verificaMaster(token: string): boolean {
    return ugualeSicuro(this.tokenMaster, token);
  }

  private tocca(): void {
    this.ultimaAttivita = this.amb.ora();
  }

  entraGiocatore(dati: { nickname?: string; token?: string; idDispositivo?: string }): EsitoEntra {
    const idDispositivo = dati.idDispositivo && /^[A-Za-z0-9-]{8,64}$/.test(dati.idDispositivo) ? dati.idDispositivo : null;

    // Riconnessione: stesso token, oppure stesso dispositivo già registrato.
    const esistente =
      (dati.token ? this.sessioni.get(dati.token) : undefined) ??
      (idDispositivo ? [...this.sessioni.values()].find((s) => s.idDispositivo === idDispositivo) : undefined);
    const g = esistente && this.stato.giocatori.find((x) => x.id === esistente.idGiocatore);
    if (esistente && g) {
      this.tocca();
      return { ok: true, sessione: esistente, nuovo: false, nickname: g.nome };
    }

    const id = `g_${idCasuale(6)}`;
    const r = this.comando(SISTEMA, { tipo: 'aggiungiGiocatore', id, nome: dati.nickname ?? '' });
    if (!r.ok) return r;
    const sessione: Sessione = { token: idCasuale(24), idGiocatore: id, idDispositivo };
    this.sessioni.set(sessione.token, sessione);
    return { ok: true, sessione, nuovo: true, nickname: this.stato.giocatori.find((x) => x.id === id)!.nome };
  }

  comando(attore: Attore, c: Comando): EsitoComandoStanza {
    const r = applica(this.stato, attore, c, { casuale: this.amb.casuale(), ora: this.amb.ora() });
    if (!r.ok) return r;
    this.stato = r.stato;
    let espulsi: IdGiocatore[] = [];
    if (c.tipo === 'rimuoviGiocatore') {
      espulsi = [c.id];
      for (const [token, s] of this.sessioni) if (s.idGiocatore === c.id) this.sessioni.delete(token);
    }
    this.tocca();
    return { ok: true, espulsi };
  }

  /** Comando dal telefono del Master (che è anche un giocatore). */
  comandoMaster(c: Comando): EsitoComandoStanza {
    return this.comando(giocatore(this.idMaster), c);
  }

  /**
   * Aggiunge le coppie già uscite nelle serate precedenti (memoria del telefono del Master),
   * così la stanza pesca prima le parole mai viste. Le coppie che non esistono più si scartano.
   */
  ricordaCoppie(ids: readonly string[]): void {
    const usate = new Set(this.stato.coppieUsate.filter(coppiaEsiste));
    for (const id of ids) if (coppiaEsiste(id)) usate.add(id);
    this.stato = { ...this.stato, coppieUsate: [...usate] };
  }

  /** Se il turno a tempo è scaduto lo chiude. Restituisce true se lo stato è cambiato. */
  controllaScadenze(): boolean {
    const fine = this.stato.partita?.fineTurnoA;
    if (fine == null || this.amb.ora() < fine) return false;
    return this.comando(SISTEMA, { tipo: 'scadenza' }).ok;
  }

  pacchetto(id: IdGiocatore, connessi: Record<IdGiocatore, boolean>): PacchettoVista {
    return { codice: this.codice, connessi, vista: vistaPer(this.stato, id, this.amb.ora()) };
  }

  serializza(): string {
    return JSON.stringify({
      codice: this.codice, tokenMaster: this.tokenMaster, stato: this.stato, creata: this.creata,
      ultimaAttivita: this.ultimaAttivita, sessioni: [...this.sessioni.values()],
    });
  }

  static deserializza(json: string, amb: Partial<AmbienteStanza> = {}): Stanza {
    const d = JSON.parse(json) as {
      codice: string; tokenMaster: string; stato: StatoStanza; creata: number; ultimaAttivita: number; sessioni: Sessione[];
    };
    const s = new Stanza(d.codice, d.tokenMaster, d.stato, amb);
    s.creata = d.creata;
    s.ultimaAttivita = d.ultimaAttivita;
    for (const ses of d.sessioni) s.sessioni.set(ses.token, ses);
    return s;
  }
}
