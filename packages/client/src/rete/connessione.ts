import { Stanza, type StanzaCreata } from '@impostore/engine';
import { archivioIdb, eliminaStanza } from './p2p/archivioIdb';
import { HostLocale } from './p2p/host';
import { TrasportoOspite } from './p2p/ospite';
import type { Trasporto } from './trasporto';

// Dove vive la partita: sul telefono del Master, che fa da server.
// Gli amici si collegano direttamente al suo telefono (WebRTC tramite PeerJS): basta un'app statica.

// PeerJS si carica solo quando serve: pagina più leggera sui dati mobili.
const caricaPeer = () => import('./p2p/peer');

let host: { host: HostLocale; chiudiTavolo: () => void } | null = null;

async function avviaHost(h: HostLocale): Promise<HostLocale> {
  if (host?.host.codice === h.codice) return host.host;
  chiudiHost();
  const { apriTavolo } = await caricaPeer();
  host = { host: h, chiudiTavolo: apriTavolo(h) };
  return h;
}

export function chiudiHost(): void {
  if (!host) return;
  host.chiudiTavolo();
  host.host.chiudi();
  host = null;
}

/** Crea una stanza nuova (il Master è già seduto al tavolo) e restituisce codice e token del Master. */
export async function creaStanza(nomeMaster: string): Promise<StanzaCreata> {
  const stanza = Stanza.nuova(nomeMaster);
  // Le parole uscite nelle serate precedenti su questo telefono non vengono ripescate subito.
  stanza.ricordaCoppie(await archivioIdb.coppieUsate().catch(() => []));
  const h = new HostLocale(stanza, archivioIdb);
  await h.salvaSubito();
  await avviaHost(h);
  return { codice: stanza.codice, tokenMaster: stanza.tokenMaster };
}

/** Il trasporto per chi fa il Master della stanza `codice` (null se la stanza non è su questo telefono). */
export async function trasportoMaster(codice: string): Promise<Trasporto | null> {
  if (host?.host.codice === codice) return host.host;
  const dati = await archivioIdb.caricaPartita(codice);
  if (!dati) return null;
  const stanza = Stanza.deserializza(dati);
  stanza.ricordaCoppie(await archivioIdb.coppieUsate().catch(() => []));
  return avviaHost(new HostLocale(stanza, archivioIdb));
}

/** Il trasporto per un giocatore che entra nella stanza `codice`. */
export async function trasportoGiocatore(codice: string, precedente: Trasporto | null): Promise<Trasporto> {
  if (precedente instanceof TrasportoOspite && precedente.codicePartita === codice) return precedente;
  precedente?.chiudi();
  const { connettiAlMaster } = await caricaPeer();
  return new TrasportoOspite(codice, connettiAlMaster);
}

export async function dimenticaStanzaOspitata(codice: string): Promise<void> {
  if (host?.host.codice === codice) chiudiHost();
  await eliminaStanza(codice);
}
