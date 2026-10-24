// Protocollo diretto telefono ↔ telefono: il telefono del Master ospita la partita.
// Gli amici inviano solo intenzioni (comandi); chi ospita le valida con il motore
// e risponde a ciascuno con la propria vista filtrata.

import type { IdGiocatore } from './tipi.js';
import type { Vista } from './viste.js';

export type Esito = { ok: true } | { ok: false; errore: string };

export type RispostaEntra =
  | { ok: true; idGiocatore: IdGiocatore; token: string }
  | { ok: false; errore: string };

/** Ciò che chi ospita invia a ogni telefono dopo ogni cambiamento. */
export interface PacchettoVista {
  codice: string;
  /** Chi è collegato in questo momento (non rivela nulla del gioco). */
  connessi: Record<IdGiocatore, boolean>;
  vista: Vista;
}

export type MessaggioOspite =
  | { t: 'entra'; id: number; dati: { nickname?: string; token?: string; idDispositivo?: string } }
  | { t: 'comando'; id: number; comando: unknown };

export type MessaggioHost =
  | { t: 'risposta'; id: number; r: Esito | RispostaEntra }
  | { t: 'vista'; p: PacchettoVista }
  | { t: 'espulso' };

export interface StanzaCreata {
  codice: string;
  tokenMaster: string;
}
