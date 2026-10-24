import {
  giocatore, Limitatore, Stanza, validaComando,
  type Comando, type Esito, type EsitoComandoStanza, type IdGiocatore, type MessaggioOspite, type RispostaEntra,
} from '@impostore/engine';
import { Emettitore, type Ascoltatori, type CanaleVersoOspite, type DatiIngresso, type Trasporto } from '../trasporto';

// Il telefono del Master fa da "server": tiene la partita (la Stanza del motore),
// accoglie i telefoni degli amici e manda a ciascuno solo la sua vista filtrata.
// Il Master gioca anche lui: i suoi comandi partono come quelli di un giocatore qualsiasi.

/** Dove il Master salva la partita (IndexedDB nell'app, memoria nei test). */
export interface ArchivioHost {
  salvaPartita(codice: string, dati: string): Promise<void>;
  caricaPartita(codice: string): Promise<string | undefined>;
  /** Le coppie di parole già uscite su questo telefono, in tutte le serate. */
  coppieUsate(): Promise<string[]>;
  salvaCoppieUsate(ids: string[]): Promise<void>;
}

/** Chi ospita la partita si presenta alla rete con questo nome: gli ospiti lo trovano dal codice. */
export function idPeerDelCodice(codice: string): string {
  return `impostore-party-v1-${codice.toLowerCase()}`;
}

interface Collegamento {
  idGiocatore: IdGiocatore | null;
  limite: Limitatore;
}

export class HostLocale implements Trasporto {
  readonly tipo = 'host';
  private em = new Emettitore();
  private collegamenti = new Map<CanaleVersoOspite, Collegamento>();
  private salvataggio: ReturnType<typeof setTimeout> | null = null;
  private orologio: ReturnType<typeof setInterval>;
  private memoriaSalvata: readonly string[] | null = null;
  /** La rete (PeerJS) è pronta a ricevere gli ospiti? */
  reteAperta = false;

  constructor(public stanza: Stanza, private archivio: ArchivioHost, private ora: () => number = Date.now) {
    // I turni a tempo scadono anche se nessuno tocca niente.
    this.orologio = setInterval(() => {
      if (this.stanza.controllaScadenze()) this.dopo();
    }, 500);
  }

  get codice(): string {
    return this.stanza.codice;
  }

  ascolta(a: Partial<Ascoltatori>): void {
    this.em.ascolta(a);
    a.connessione?.(this.reteAperta);
  }

  impostaReteAperta(aperta: boolean): void {
    this.reteAperta = aperta;
    this.em.connessione(aperta);
  }

  // ——— Lato Master (stesso dispositivo) ———

  async entraComeMaster(codice: string, tokenMaster: string): Promise<Esito> {
    if (codice !== this.stanza.codice || !this.stanza.verificaMaster(tokenMaster)) return { ok: false, errore: 'Questa stanza non è tua.' };
    this.diffondi();
    return { ok: true };
  }

  async entraComeGiocatore(): Promise<RispostaEntra> {
    return { ok: false, errore: 'Su questo telefono c\'è il Master.' };
  }

  async comando(c: Comando): Promise<Esito> {
    const r = this.stanza.comandoMaster(c);
    if (!r.ok) return r;
    this.dopo(r);
    return { ok: true };
  }

  chiudi(): void {
    clearInterval(this.orologio);
    if (this.salvataggio) void this.salvaSubito();
    for (const canale of this.collegamenti.keys()) canale.chiudi();
    this.collegamenti.clear();
  }

  // ——— Lato ospiti (i telefoni degli amici) ———

  /** Un nuovo telefono si è collegato. */
  accogli(canale: CanaleVersoOspite): void {
    const c: Collegamento = { idGiocatore: null, limite: new Limitatore(16, 8, this.ora) };
    this.collegamenti.set(canale, c);
    canale.suMessaggio((m) => this.suMessaggio(canale, c, m));
    canale.suChiusura(() => {
      this.collegamenti.delete(canale);
      if (c.idGiocatore) this.diffondi();
    });
  }

  private suMessaggio(canale: CanaleVersoOspite, c: Collegamento, m: MessaggioOspite): void {
    if (!m || typeof m !== 'object' || typeof m.id !== 'number') return;
    const rispondi = (r: Esito | RispostaEntra) => canale.invia({ t: 'risposta', id: m.id, r });
    if (!c.limite.consuma('x')) return rispondi({ ok: false, errore: 'Troppe richieste: rallenta un attimo.' });

    if (m.t === 'entra') {
      const d = (m.dati ?? {}) as DatiIngresso;
      const str = (x: unknown) => (typeof x === 'string' && x.length <= 200 ? x : undefined);
      const r = this.stanza.entraGiocatore({ nickname: str(d.nickname), token: str(d.token), idDispositivo: str(d.idDispositivo) });
      if (!r.ok) return rispondi(r);
      c.idGiocatore = r.sessione.idGiocatore;
      rispondi({ ok: true, idGiocatore: r.sessione.idGiocatore, token: r.sessione.token });
      this.dopo();
      return;
    }

    if (m.t === 'comando') {
      if (!c.idGiocatore) return rispondi({ ok: false, errore: 'Prima entra nella stanza.' });
      const comando = validaComando(m.comando);
      if (!comando) return rispondi({ ok: false, errore: 'Comando non valido.' });
      const r = this.stanza.comando(giocatore(c.idGiocatore), comando);
      if (!r.ok) return rispondi(r);
      rispondi({ ok: true });
      this.dopo(r);
    }
  }

  private dopo(r?: Extract<EsitoComandoStanza, { ok: true }>): void {
    for (const id of r?.espulsi ?? []) {
      for (const [canale, c] of this.collegamenti) {
        if (c.idGiocatore !== id) continue;
        canale.invia({ t: 'espulso' });
        c.idGiocatore = null;
      }
    }
    this.salva();
    this.diffondi();
  }

  // ——— Viste ———

  private connessi(): Record<IdGiocatore, boolean> {
    const online = new Set([...this.collegamenti.values()].map((c) => c.idGiocatore).filter(Boolean));
    online.add(this.stanza.idMaster);
    return Object.fromEntries(this.stanza.stato.giocatori.map((g) => [g.id, online.has(g.id)]));
  }

  /** Manda a ognuno la sua vista: anche il Master riceve solo la sua (pure lui ha una carta segreta). */
  diffondi(): void {
    const connessi = this.connessi();
    this.em.vista(this.stanza.pacchetto(this.stanza.idMaster, connessi));
    for (const [canale, c] of this.collegamenti) {
      if (!c.idGiocatore || !this.stanza.stato.giocatori.some((g) => g.id === c.idGiocatore)) continue;
      canale.invia({ t: 'vista', p: this.stanza.pacchetto(c.idGiocatore, connessi) });
    }
  }

  // ——— Salvataggi ———

  private salva(): void {
    if (this.salvataggio) return;
    this.salvataggio = setTimeout(() => void this.salvaSubito(), 300);
  }

  async salvaSubito(): Promise<void> {
    if (this.salvataggio) clearTimeout(this.salvataggio);
    this.salvataggio = null;
    await this.archivio.salvaPartita(this.stanza.codice, this.stanza.serializza());
    // La memoria delle parole uscite vale per tutte le serate di questo telefono.
    const usate = this.stanza.stato.coppieUsate;
    if (usate !== this.memoriaSalvata) {
      this.memoriaSalvata = usate;
      await this.archivio.salvaCoppieUsate(usate);
    }
  }
}
