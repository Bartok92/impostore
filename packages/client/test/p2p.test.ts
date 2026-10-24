import { afterEach, describe, expect, it } from 'vitest';
import { Stanza, type MessaggioHost, type MessaggioOspite, type PacchettoVista, type Vista } from '@impostore/engine';
import type { CanaleVersoHost, CanaleVersoOspite } from '../src/rete/trasporto';
import { HostLocale, type ArchivioHost } from '../src/rete/p2p/host';
import { TrasportoOspite } from '../src/rete/p2p/ospite';

// "Cavo" finto tra due telefoni: i messaggi passano come JSON e arrivano in modo asincrono, come in WebRTC.
function cavo(): { versoOspite: CanaleVersoOspite; versoHost: CanaleVersoHost; taglia: () => void } {
  const lato = <In,>() => ({ messaggio: [] as ((m: In) => void)[], chiusura: [] as (() => void)[] });
  const h = lato<MessaggioOspite>();
  const o = lato<MessaggioHost>();
  let aperto = true;
  const taglia = () => {
    if (!aperto) return;
    aperto = false;
    queueMicrotask(() => [...h.chiusura, ...o.chiusura].forEach((f) => f()));
  };
  return {
    versoOspite: {
      invia: (m) => aperto && queueMicrotask(() => o.messaggio.forEach((f) => f(JSON.parse(JSON.stringify(m))))),
      suMessaggio: (cb) => h.messaggio.push(cb),
      suChiusura: (cb) => h.chiusura.push(cb),
      chiudi: taglia,
    },
    versoHost: {
      invia: (m) => aperto && queueMicrotask(() => h.messaggio.forEach((f) => f(JSON.parse(JSON.stringify(m))))),
      suMessaggio: (cb) => o.messaggio.push(cb),
      suChiusura: (cb) => o.chiusura.push(cb),
      chiudi: taglia,
    },
    taglia,
  };
}

function archivioInMemoria(): ArchivioHost & { dati: Map<string, string>; memoria: string[] } {
  const dati = new Map<string, string>();
  const a = {
    dati,
    memoria: [] as string[],
    salvaPartita: async (c: string, d: string) => void dati.set(c, d),
    caricaPartita: async (c: string) => dati.get(c),
    coppieUsate: async () => a.memoria,
    salvaCoppieUsate: async (ids: string[]) => void (a.memoria = [...ids]),
  };
  return a;
}

/** Il telefono di un amico, con l'ultima vista ricevuta. */
class Amico {
  viste: PacchettoVista[] = [];
  espulso = false;
  cavi: ReturnType<typeof cavo>[] = [];
  t: TrasportoOspite;
  id?: string;
  token?: string;

  constructor(host: HostLocale, public nome: string, public idDispositivo = `disp-${nome}-00000000`) {
    this.t = new TrasportoOspite('X', async () => {
      const c = cavo();
      this.cavi.push(c);
      host.accogli(c.versoOspite);
      return c.versoHost;
    }, 20);
    this.t.ascolta({ vista: (p) => this.viste.push(p), espulso: () => (this.espulso = true) });
  }
  get v(): Vista {
    return this.viste.at(-1)!.vista;
  }
  async entra(extra: { token?: string } = {}) {
    const r = await this.t.entraComeGiocatore('X', { nickname: this.nome, idDispositivo: this.idDispositivo, ...extra });
    if (r.ok) Object.assign(this, { id: r.idGiocatore, token: r.token });
    return r;
  }
}

const attendi = async (cond: () => boolean) => {
  for (let i = 0; i < 200 && !cond(); i++) await new Promise((r) => setTimeout(r, 2));
  expect(cond()).toBe(true);
};

let amici: Amico[] = [];
let ospite: HostLocale | null = null;
afterEach(() => {
  amici.forEach((a) => a.t.chiudi());
  amici = [];
  ospite?.chiudi();
  ospite = null;
});

async function tavolo(n: number, archivio = archivioInMemoria()) {
  const stanza = Stanza.nuova('Giulia', {}, 'X');
  const host = new HostLocale(stanza, archivio);
  ospite = host;
  let master: PacchettoVista | null = null;
  host.ascolta({ vista: (p) => (master = p) });
  amici = ['Luca', 'Marco', 'Sara', 'Elena'].slice(0, n).map((nome) => new Amico(host, nome));
  for (const a of amici) expect((await a.entra()).ok).toBe(true);
  await attendi(() => amici.every((a) => a.viste.at(-1)?.vista.giocatori.length === n + 1));
  return { host, stanza, archivio, master: () => master! };
}

describe('il telefono del Master ospita la stanza', () => {
  it('gli amici entrano; il Master è seduto al tavolo e li vede collegati', async () => {
    const { master } = await tavolo(3);
    const m = master().vista;
    expect(m.master).toBe(true);
    expect(m.giocatori.map((g) => g.nome)).toEqual(['Giulia', 'Luca', 'Marco', 'Sara']);
    expect(Object.values(master().connessi)).toEqual([true, true, true, true]);
    expect(amici[0]!.v.master).toBe(false);
    expect(amici[0]!.v.io).toBe(amici[0]!.id);
  });

  it('distribuisce le carte: ognuno, Master compreso, vede solo la propria', async () => {
    const { host, stanza, master } = await tavolo(3);
    expect((await host.comando({ tipo: 'avviaPartita' })).ok).toBe(true);
    await attendi(() => amici.every((a) => a.v.fase === 'parola'));
    const p = stanza.stato.partita!;
    for (const pacchetto of [master(), ...amici.map((a) => a.viste.at(-1)!)]) {
      const io = pacchetto.vista.io;
      const ruolo = p.ruoli[io]!;
      expect(pacchetto.vista.partita!.mia!.ruolo).toBe(ruolo);
      const altra = ruolo === 'detective' ? p.parolaImpostore : p.parolaDetective;
      expect(JSON.stringify(pacchetto)).not.toContain(`"${altra}"`);
      expect(JSON.stringify(pacchetto)).not.toMatch(/"ruoli"|"coppia"/);
    }
  });

  it('una partita intera passa dalla rete: indizi, voto, verdetto', async () => {
    const { host, stanza, master } = await tavolo(2);
    await host.comando({ tipo: 'avviaPartita' });
    await attendi(() => amici.every((a) => a.v.fase === 'parola'));
    for (const a of amici) expect((await a.t.comando({ tipo: 'confermaVisto' })).ok).toBe(true);
    await host.comando({ tipo: 'confermaVisto' });
    await attendi(() => amici.every((a) => a.v.fase === 'indizi'));
    while (stanza.stato.fase === 'indizi') {
      const parla = master().vista.partita!.parla!;
      const chi = amici.find((a) => a.id === parla);
      const r = chi ? await chi.t.comando({ tipo: 'indizio', testo: 'boh' }) : await host.comando({ tipo: 'indizio', testo: 'boh' });
      expect(r.ok).toBe(true);
    }
    const imp = Object.entries(stanza.stato.partita!.ruoli).find(([, r]) => r === 'impostore')![0];
    const det = Object.entries(stanza.stato.partita!.ruoli).find(([, r]) => r === 'detective')![0];
    for (const a of amici) await a.t.comando({ tipo: 'voto', bersaglio: a.id === imp ? det : imp });
    await host.comando({ tipo: 'voto', bersaglio: stanza.idMaster === imp ? det : imp });
    await attendi(() => amici.every((a) => a.v.fase === 'verdetto'));
    expect(amici[0]!.v.partita!.verdetto!.eliminato).toBe(imp);
    expect((await amici[0]!.t.comando({ tipo: 'prosegui' })).ok).toBe(false);
    await host.comando({ tipo: 'prosegui' });
    await attendi(() => amici.every((a) => a.v.fase === 'fine'));
    expect(amici[0]!.v.partita!.vittoria!.squadra).toBe('detective');
  });

  it('se la connessione cade, l\'amico rientra da solo con la stessa identità', async () => {
    const { master } = await tavolo(2);
    const luca = amici[0]!;
    const id = luca.id;
    luca.cavi.at(-1)!.taglia();
    await attendi(() => master().connessi[id!] === false);
    // Il trasporto si ricollega; lo store si ripresenta con il token.
    await attendi(() => luca.cavi.length === 2);
    expect((await luca.entra({ token: luca.token })).ok).toBe(true);
    expect(luca.id).toBe(id);
    await attendi(() => master().connessi[id!] === true);
    expect(master().vista.giocatori).toHaveLength(3);
  });

  it('chi viene tolto dalla stanza riceve "espulso"', async () => {
    const { host } = await tavolo(2);
    await host.comando({ tipo: 'rimuoviGiocatore', id: amici[1]!.id! });
    await attendi(() => amici[1]!.espulso);
    expect(amici[0]!.v.giocatori.map((g) => g.nome)).toEqual(['Giulia', 'Luca']);
  });

  it('i comandi riservati non passano dalla rete', async () => {
    const { stanza } = await tavolo(2);
    const r = await amici[0]!.t.comando({ tipo: 'aggiungiGiocatore', id: 'x', nome: 'Intruso' });
    expect(r).toEqual({ ok: false, errore: 'Comando non valido.' });
    expect((await amici[0]!.t.comando({ tipo: 'avviaPartita' })).ok).toBe(false);
    expect(stanza.stato.giocatori).toHaveLength(3);
  });

  it('il telefono del Master ricorda le parole uscite anche nella stanza della serata dopo', async () => {
    const { host, archivio, stanza } = await tavolo(2);
    await host.comando({ tipo: 'avviaPartita' });
    await host.salvaSubito();
    const uscita = stanza.stato.partita!.coppia;
    expect(archivio.memoria).toContain(uscita);
    // La serata dopo: stanza nuova sullo stesso telefono.
    const domani = Stanza.nuova('Giulia', {}, 'Y');
    domani.ricordaCoppie(await archivio.coppieUsate());
    expect(domani.stato.coppieUsate).toContain(uscita);
  });

  it('la partita si salva e riparte dall\'archivio', async () => {
    const { host, archivio, stanza } = await tavolo(2);
    await host.comando({ tipo: 'avviaPartita' });
    await host.salvaSubito();
    const ripresa = Stanza.deserializza(archivio.dati.get('X')!);
    expect(ripresa.stato).toEqual(stanza.stato);
  });
});

describe('tentativi di collegamento', () => {
  it('le attese crescono (con un po\' di casualità) fino a un massimo, e si azzerano dopo un collegamento riuscito', async () => {
    const { Ritardo } = await import('../src/rete/p2p/ritardo');
    const r = new Ritardo(3000, 60_000);
    const attese = Array.from({ length: 8 }, () => r.prossimo());
    expect(attese[0]).toBeGreaterThanOrEqual(2400);
    expect(attese[0]).toBeLessThanOrEqual(3600);
    expect(attese[3]).toBeGreaterThanOrEqual(24_000 * 0.8);
    expect(Math.max(...attese)).toBeLessThanOrEqual(72_000);
    expect(attese[7]).toBeGreaterThanOrEqual(48_000);
    r.azzera();
    expect(r.prossimo()).toBeLessThanOrEqual(3600);
  });
});
