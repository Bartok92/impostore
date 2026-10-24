import type { Comando } from './comandi.js';
import type { Impostazioni } from './impostazioni.js';

// Validazione dei comandi in arrivo dai telefoni degli amici: non ci si fida di nulla.
// Restituisce un comando "pulito" (solo i campi noti) oppure null.
// `aggiungiGiocatore` e `scadenza` non sono mai accettati dalla rete: li genera solo chi ospita.

const MAX_STR = 200;
const str = (v: unknown): v is string => typeof v === 'string' && v.length <= MAX_STR;

export function validaComando(x: unknown): Comando | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  switch (o.tipo) {
    case 'avviaPartita':
    case 'iniziaIndizi':
    case 'saltaTurno':
    case 'chiudiVoto':
    case 'prosegui':
    case 'tornaAllaLobby':
    case 'confermaVisto':
      return { tipo: o.tipo };
    case 'rimuoviGiocatore':
      return str(o.id) ? { tipo: 'rimuoviGiocatore', id: o.id } : null;
    case 'impostaImpostazioni':
      return o.impostazioni && typeof o.impostazioni === 'object' && !Array.isArray(o.impostazioni)
        ? { tipo: 'impostaImpostazioni', impostazioni: o.impostazioni as Partial<Impostazioni> }
        : null;
    case 'indizio':
      return o.testo === null || str(o.testo) ? { tipo: 'indizio', testo: o.testo } : null;
    case 'voto':
      return str(o.bersaglio) ? { tipo: 'voto', bersaglio: o.bersaglio } : null;
    case 'indovina':
      return str(o.testo) ? { tipo: 'indovina', testo: o.testo } : null;
    default:
      return null;
  }
}
