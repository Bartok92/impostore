import { del, get, keys, set } from 'idb-keyval';
import type { StatoStanza } from '@impostore/engine';
import type { ArchivioHost } from './host';

// Archivio del telefono del Master (IndexedDB): le stanze ospitate.
// Sopravvive alla chiusura della pagina e al riavvio del telefono.

export const archivioIdb: ArchivioHost = {
  salvaPartita: (codice, dati) => set(`stanza:${codice}`, dati),
  caricaPartita: (codice) => get<string>(`stanza:${codice}`),
};

export interface StanzaSalvata {
  codice: string;
  fase: StatoStanza['fase'];
  giocatori: number;
  ultimaAttivita: number;
}

/** Le stanze ospitate da questo telefono, dalla più recente. */
export async function stanzeSalvate(): Promise<StanzaSalvata[]> {
  const chiavi = (await keys()).filter((k): k is string => typeof k === 'string' && k.startsWith('stanza:'));
  const out: StanzaSalvata[] = [];
  for (const k of chiavi) {
    try {
      const d = JSON.parse((await get<string>(k)) ?? '') as { codice: string; stato: StatoStanza; ultimaAttivita: number };
      out.push({ codice: d.codice, fase: d.stato.fase, giocatori: d.stato.giocatori.length, ultimaAttivita: d.ultimaAttivita });
    } catch {
      // stanza illeggibile: la ignoriamo
    }
  }
  return out.sort((a, b) => b.ultimaAttivita - a.ultimaAttivita);
}

export function eliminaStanza(codice: string): Promise<void> {
  return del(`stanza:${codice}`);
}
