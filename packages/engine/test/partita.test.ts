import { describe, expect, it } from 'vitest';
import {
  casualeDaSeme, contieneParola, giocatore, maxInfiltrati, paroleUguali, problemiComposizione, Stanza, validaComando, vistaPer,
  IMPOSTAZIONI_INIZIALI, PUNTI, type Comando, type IdGiocatore, type Impostazioni, type Ruolo,
} from '../src/index.js';

// Tavolo di prova: orologio finto e casualità riproducibile.
function tavolo(nomi: string[], imp: Partial<Impostazioni> = {}, seme = 1) {
  let ora = 1_000_000;
  const caso = casualeDaSeme(seme);
  const stanza = Stanza.nuova(nomi[0]!, { ora: () => ora, casuale: () => caso }, 'PROVA');
  for (const n of nomi.slice(1)) expect(stanza.entraGiocatore({ nickname: n }).ok).toBe(true);
  const id = (nome: string) => stanza.stato.giocatori.find((g) => g.nome === nome)!.id;
  const master = (c: Comando) => stanza.comandoMaster(c);
  const da = (nome: string, c: Comando) => stanza.comando(giocatore(id(nome)), c);
  expect(master({ tipo: 'impostaImpostazioni', impostazioni: imp }).ok).toBe(true);
  return {
    stanza, id, master, da,
    avanza: (ms: number) => void (ora += ms),
    get s() { return stanza.stato; },
    get p() { return stanza.stato.partita!; },
    ruolo: (nome: string): Ruolo => stanza.stato.partita!.ruoli[id(nome)]!,
    conRuolo: (r: Ruolo) => nomi.filter((n) => stanza.stato.partita!.ruoli[id(n)] === r),
    nomeDi: (gid: IdGiocatore) => stanza.stato.giocatori.find((g) => g.id === gid)!.nome,
    vista: (nome: string) => vistaPer(stanza.stato, id(nome), ora),
  };
}

type Tavolo = ReturnType<typeof tavolo>;

/** Tutti confermano la carta e dicono un indizio a voce, fino alla votazione. */
function finoAlVoto(t: Tavolo) {
  if (t.s.fase === 'parola') for (const g of t.s.giocatori) t.da(g.nome, { tipo: 'confermaVisto' });
  while (t.s.fase === 'indizi') expect(t.da(t.nomeDi(t.p.parlanti[t.p.turno]!), { tipo: 'indizio', testo: null }).ok).toBe(true);
  expect(t.s.fase).toBe('voto');
}

/** Tutti quelli in gioco votano `bersaglio` (chi è il bersaglio vota `alternativa`). */
function votaTutti(t: Tavolo, bersaglio: string, alternativa: string) {
  for (const id of t.p.ordine.filter((x) => !t.p.eliminati.some((e) => e.id === x))) {
    const nome = t.nomeDi(id);
    expect(t.da(nome, { tipo: 'voto', bersaglio: t.id(nome === bersaglio ? alternativa : bersaglio) }).ok).toBe(true);
  }
}

describe('composizione', () => {
  it('i detective devono restare la maggioranza', () => {
    const imp = (x: Partial<Impostazioni>) => ({ ...IMPOSTAZIONI_INIZIALI, ...x });
    expect(problemiComposizione(2, imp({}))).toHaveLength(1);
    expect(problemiComposizione(3, imp({}))).toEqual([]);
    expect(problemiComposizione(4, imp({ mrWhite: true }))).toHaveLength(1);
    expect(problemiComposizione(4, imp({ impostori: 0, mrWhite: true }))).toEqual([]);
    expect(problemiComposizione(5, imp({ mrWhite: true }))).toEqual([]);
    expect(problemiComposizione(6, imp({ impostori: 0 }))).toHaveLength(1);
    expect([3, 4, 5, 6, 7, 8].map(maxInfiltrati)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('solo il Master avvia, e non con troppi infiltrati', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara'], { mrWhite: true });
    expect(t.da('Luca', { tipo: 'avviaPartita' }).ok).toBe(false);
    expect(t.master({ tipo: 'avviaPartita' })).toMatchObject({ ok: false });
    t.master({ tipo: 'impostaImpostazioni', impostazioni: { impostori: 0 } });
    expect(t.master({ tipo: 'avviaPartita' }).ok).toBe(true);
    expect(t.conRuolo('mrwhite')).toHaveLength(1);
    expect(t.conRuolo('impostore')).toHaveLength(0);
  });
});

describe('carte e segreti', () => {
  it('distribuisce ruoli e parole', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara', 'Tommaso', 'Elena'], { mrWhite: true, categoria: 'luoghi' });
    expect(t.master({ tipo: 'avviaPartita' }).ok).toBe(true);
    expect(t.s.fase).toBe('parola');
    expect(t.conRuolo('detective')).toHaveLength(4);
    expect(t.conRuolo('impostore')).toHaveLength(1);
    expect(t.conRuolo('mrwhite')).toHaveLength(1);
    expect(t.p.categoria).toBe('luoghi');
    expect(t.p.parolaDetective).not.toBe(t.p.parolaImpostore);
    for (const n of t.conRuolo('detective')) expect(t.vista(n).partita!.mia).toEqual({ ruolo: 'detective', parola: t.p.parolaDetective, inGioco: true });
    expect(t.vista(t.conRuolo('impostore')[0]!).partita!.mia).toMatchObject({ ruolo: 'impostore', parola: t.p.parolaImpostore });
    expect(t.vista(t.conRuolo('mrwhite')[0]!).partita!.mia).toMatchObject({ ruolo: 'mrwhite', parola: null });
  });

  it('nessuno vede la parola o il ruolo degli altri', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara', 'Tommaso'], { mrWhite: true });
    t.master({ tipo: 'avviaPartita' });
    const det = t.conRuolo('detective')[0]!;
    const json = JSON.stringify(t.vista(det));
    expect(json).not.toContain(`"${t.p.parolaImpostore}"`);
    expect(json).not.toMatch(/"ruoli"|"impostore"|"mrwhite"|"coppia"/);
    const imp = JSON.stringify(t.vista(t.conRuolo('impostore')[0]!));
    expect(imp).not.toContain(`"${t.p.parolaDetective}"`);
    const mw = JSON.stringify(t.vista(t.conRuolo('mrwhite')[0]!));
    expect(mw).not.toContain(`"${t.p.parolaDetective}"`);
    expect(mw).not.toContain(`"${t.p.parolaImpostore}"`);
    expect(t.vista(det).giocatori.every((g) => g.ruolo === null)).toBe(true);
  });

  it('impostore inconsapevole: la sua carta dice detective', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco'], { inconsapevole: true });
    t.master({ tipo: 'avviaPartita' });
    const imp = t.conRuolo('impostore')[0]!;
    expect(t.vista(imp).partita!.mia).toEqual({ ruolo: 'detective', parola: t.p.parolaImpostore, inGioco: true });
    expect(JSON.stringify(t.vista(imp))).not.toContain('"impostore"');
  });

  it('le categorie 18+ escono solo se scelte apposta, mai con "Casuale"', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco']);
    for (let i = 0; i < 200; i++) {
      t.master({ tipo: 'avviaPartita' });
      expect(['piccante', 'senzacensura']).not.toContain(t.p.categoria);
      t.master({ tipo: 'tornaAllaLobby' });
    }
    for (const cat of ['piccante', 'senzacensura'] as const) {
      t.master({ tipo: 'impostaImpostazioni', impostazioni: { categoria: cat } });
      t.master({ tipo: 'avviaPartita' });
      expect(t.p.categoria).toBe(cat);
      expect(t.vista('Luca').partita!.categoria).toBe(cat);
      t.master({ tipo: 'tornaAllaLobby' });
    }
  });

  it('le coppie di parole non si ripetono nella stessa stanza', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco'], { categoria: 'sport' });
    const viste = new Set<string>();
    for (let i = 0; i < 24; i++) {
      t.master({ tipo: 'avviaPartita' });
      viste.add(t.p.coppia);
      t.master({ tipo: 'tornaAllaLobby' });
    }
    expect(viste.size).toBe(24);
  });
});

describe('indizi', () => {
  it('quando tutti hanno visto la carta si parte; Mr. White non parla mai per primo', () => {
    for (let seme = 1; seme <= 30; seme++) {
      const t = tavolo(['A', 'B', 'C', 'D', 'E'], { mrWhite: true }, seme);
      t.master({ tipo: 'avviaPartita' });
      for (const n of ['A', 'B', 'C', 'D']) t.da(n, { tipo: 'confermaVisto' });
      expect(t.s.fase).toBe('parola');
      t.da('E', { tipo: 'confermaVisto' });
      expect(t.s.fase).toBe('indizi');
      expect(t.ruolo(t.nomeDi(t.p.parlanti[0]!))).not.toBe('mrwhite');
    }
  });

  it('a turno, senza scrivere la propria parola', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco']);
    t.master({ tipo: 'avviaPartita' });
    t.master({ tipo: 'iniziaIndizi' });
    const primo = t.nomeDi(t.p.parlanti[0]!);
    const secondo = t.nomeDi(t.p.parlanti[1]!);
    expect(t.da(secondo, { tipo: 'indizio', testo: 'ciao' })).toMatchObject({ ok: false, errore: 'Non è il tuo turno.' });
    const parola = t.vista(primo).partita!.mia!.parola!;
    expect(t.da(primo, { tipo: 'indizio', testo: parola.toUpperCase() }).ok).toBe(false);
    expect(t.da(primo, { tipo: 'indizio', testo: '  un   indizio  ' }).ok).toBe(true);
    expect(t.p.indizi[0]).toMatchObject({ testo: 'un indizio', esito: 'scritto', giro: 1, passaggio: 1 });
    expect(t.da(secondo, { tipo: 'indizio', testo: null }).ok).toBe(true);
    expect(t.p.indizi[1]).toMatchObject({ testo: null, esito: 'aVoce' });
    expect(t.master({ tipo: 'saltaTurno' }).ok).toBe(true);
    expect(t.p.indizi[2]!.esito).toBe('saltato');
    expect(t.s.fase).toBe('voto');
  });

  it('doppio giro: due passaggi prima del voto', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco'], { doppioGiro: true });
    t.master({ tipo: 'avviaPartita' });
    finoAlVoto(t);
    expect(t.p.indizi.map((i) => i.passaggio)).toEqual([1, 1, 1, 2, 2, 2]);
  });

  it('indizi a tempo: allo scadere il turno passa', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco'], { indiziATempo: true, secondiIndizio: 15 });
    t.master({ tipo: 'avviaPartita' });
    t.master({ tipo: 'iniziaIndizi' });
    expect(t.vista('Luca').partita!.rimanenteMs).toBe(15_000);
    t.avanza(10_000);
    expect(t.stanza.controllaScadenze()).toBe(false);
    expect(t.vista('Luca').partita!.rimanenteMs).toBe(5_000);
    t.avanza(5_000);
    expect(t.stanza.controllaScadenze()).toBe(true);
    expect(t.p.indizi[0]!.esito).toBe('tempo');
    expect(t.p.turno).toBe(1);
    expect(t.vista('Luca').partita!.rimanenteMs).toBe(15_000);
    expect(t.stanza.comando({ tipo: 'giocatore', id: t.id('Luca') }, { tipo: 'scadenza' }).ok).toBe(false);
  });
});

describe('voto e verdetto', () => {
  it('non si vota se stessi; il voto si chiude quando votano tutti', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara']);
    t.master({ tipo: 'avviaPartita' });
    finoAlVoto(t);
    expect(t.da('Luca', { tipo: 'voto', bersaglio: t.id('Luca') }).ok).toBe(false);
    t.da('Luca', { tipo: 'voto', bersaglio: t.id('Marco') });
    t.da('Luca', { tipo: 'voto', bersaglio: t.id('Sara') });
    expect(t.vista('Giulia').partita!.hannoVotato).toEqual([t.id('Luca')]);
    expect(t.vista('Giulia').partita!.mioVoto).toBe(null);
    expect(JSON.stringify(t.vista('Giulia').partita!.verdetto)).toBe('null');
    t.da('Giulia', { tipo: 'voto', bersaglio: t.id('Sara') });
    t.da('Marco', { tipo: 'voto', bersaglio: t.id('Sara') });
    expect(t.s.fase).toBe('voto');
    t.da('Sara', { tipo: 'voto', bersaglio: t.id('Luca') });
    expect(t.s.fase).not.toBe('voto');
    expect(t.p.verdetto).toMatchObject({ esito: 'eliminato', eliminato: t.id('Sara'), ruolo: t.ruolo('Sara') });
    expect(t.p.verdetto!.conteggio[0]).toEqual({ id: t.id('Sara'), voti: 3 });
    expect(t.vista('Giulia').giocatori.find((g) => g.nome === 'Sara')!.ruolo).toBe(t.ruolo('Sara'));
  });

  it('il Master può chiudere il voto prima, se qualcuno non risponde', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara']);
    t.master({ tipo: 'avviaPartita' });
    finoAlVoto(t);
    expect(t.master({ tipo: 'chiudiVoto' }).ok).toBe(false);
    t.da('Luca', { tipo: 'voto', bersaglio: t.id('Marco') });
    expect(t.master({ tipo: 'chiudiVoto' }).ok).toBe(true);
    expect(t.p.verdetto!.eliminato).toBe(t.id('Marco'));
  });

  it('pareggio → ballottaggio; pareggio di nuovo → nessuno esce', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara']);
    t.master({ tipo: 'avviaPartita' });
    finoAlVoto(t);
    t.da('Giulia', { tipo: 'voto', bersaglio: t.id('Luca') });
    t.da('Luca', { tipo: 'voto', bersaglio: t.id('Giulia') });
    t.da('Marco', { tipo: 'voto', bersaglio: t.id('Luca') });
    t.da('Sara', { tipo: 'voto', bersaglio: t.id('Giulia') });
    expect(t.s.fase).toBe('verdetto');
    expect(t.p.verdetto).toMatchObject({ esito: 'pareggio', ballottaggio: false });
    expect(t.p.verdetto!.pari.sort()).toEqual([t.id('Giulia'), t.id('Luca')].sort());
    t.master({ tipo: 'prosegui' });
    expect(t.s.fase).toBe('voto');
    expect(t.da('Marco', { tipo: 'voto', bersaglio: t.id('Sara') })).toMatchObject({ ok: false });
    t.da('Giulia', { tipo: 'voto', bersaglio: t.id('Luca') });
    t.da('Luca', { tipo: 'voto', bersaglio: t.id('Giulia') });
    t.da('Marco', { tipo: 'voto', bersaglio: t.id('Luca') });
    t.da('Sara', { tipo: 'voto', bersaglio: t.id('Giulia') });
    expect(t.p.verdetto).toMatchObject({ esito: 'pareggio', ballottaggio: true, eliminato: null });
    expect(t.p.eliminati).toHaveLength(0);
    t.master({ tipo: 'prosegui' });
    expect(t.s.fase).toBe('indizi');
    expect(t.p.giro).toBe(2);
  });
});

describe('vittoria e punti', () => {
  it('vincono i detective quando esce l\'impostore', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara']);
    t.master({ tipo: 'avviaPartita' });
    finoAlVoto(t);
    const imp = t.conRuolo('impostore')[0]!;
    votaTutti(t, imp, t.conRuolo('detective')[0]!);
    expect(t.s.fase).toBe('verdetto');
    expect(t.vista('Giulia').partita!.finita).toBe(true);
    expect(t.vista('Giulia').partita!.vittoria).toBe(null);
    expect(t.vista('Giulia').partita!.parole).toBe(null);
    t.master({ tipo: 'prosegui' });
    expect(t.s.fase).toBe('fine');
    const v = t.vista('Giulia');
    expect(v.partita!.vittoria!.squadra).toBe('detective');
    expect(v.partita!.parole).toEqual({ detective: t.p.parolaDetective, impostore: t.p.parolaImpostore });
    expect(v.giocatori.every((g) => g.ruolo !== null)).toBe(true);
    for (const n of t.conRuolo('detective')) expect(t.s.punti[t.id(n)]).toBe(PUNTI.detective);
    expect(t.s.punti[t.id(imp)]).toBe(0);
    expect(t.s.partiteGiocate).toBe(1);
  });

  it('vincono gli infiltrati quando i detective non sono più la maggioranza', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara']);
    t.master({ tipo: 'avviaPartita' });
    const [d1, d2, d3] = t.conRuolo('detective') as [string, string, string];
    finoAlVoto(t);
    votaTutti(t, d1, d2);
    expect(t.vista('Giulia').partita!.finita).toBe(false);
    t.master({ tipo: 'prosegui' });
    expect(t.s.fase).toBe('indizi');
    expect(t.p.parlanti).not.toContain(t.id(d1));
    finoAlVoto(t);
    expect(t.da(d1, { tipo: 'voto', bersaglio: t.id(d2) }).ok).toBe(false);
    votaTutti(t, d2, d3);
    t.master({ tipo: 'prosegui' });
    expect(t.s.fase).toBe('fine');
    expect(t.p.vittoria!.squadra).toBe('infiltrati');
    expect(t.s.punti[t.id(t.conRuolo('impostore')[0]!)]).toBe(PUNTI.infiltrato);
  });

  it('Mr. White scoperto: se indovina la parola vince da solo', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara', 'Tommaso'], { mrWhite: true });
    t.master({ tipo: 'avviaPartita' });
    const mw = t.conRuolo('mrwhite')[0]!;
    finoAlVoto(t);
    votaTutti(t, mw, t.conRuolo('detective')[0]!);
    expect(t.s.fase).toBe('mrwhite');
    expect(t.da(t.conRuolo('detective')[0]!, { tipo: 'indovina', testo: 'x' }).ok).toBe(false);
    const parola = t.p.parolaDetective;
    expect(t.da(mw, { tipo: 'indovina', testo: `  ${parola.toUpperCase()} ` }).ok).toBe(true);
    expect(t.p.verdetto!.tentativo).toEqual({ testo: parola.toUpperCase(), esatto: true });
    t.master({ tipo: 'prosegui' });
    expect(t.p.vittoria).toMatchObject({ squadra: 'mrwhite', vincitori: [t.id(mw)] });
    expect(t.s.punti[t.id(mw)]).toBe(PUNTI.mrWhiteIndovina);
  });

  it('Mr. White sbaglia: la partita continua', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara', 'Tommaso'], { mrWhite: true });
    t.master({ tipo: 'avviaPartita' });
    const mw = t.conRuolo('mrwhite')[0]!;
    finoAlVoto(t);
    votaTutti(t, mw, t.conRuolo('detective')[0]!);
    t.da(mw, { tipo: 'indovina', testo: 'sicuramente sbagliata' });
    expect(t.s.fase).toBe('verdetto');
    expect(t.p.verdetto!.tentativo!.esatto).toBe(false);
    expect(t.p.vittoria).toBe(null);
    t.master({ tipo: 'prosegui' });
    expect(t.s.fase).toBe('indizi');
  });

  it('rivincita: stessi giocatori, punti che si sommano', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco']);
    t.master({ tipo: 'avviaPartita' });
    finoAlVoto(t);
    votaTutti(t, t.conRuolo('impostore')[0]!, t.conRuolo('detective')[0]!);
    t.master({ tipo: 'prosegui' });
    const prima = t.p.coppia;
    expect(t.master({ tipo: 'avviaPartita' }).ok).toBe(true);
    expect(t.s.fase).toBe('parola');
    expect(t.p.numero).toBe(2);
    expect(t.p.coppia).not.toBe(prima);
    expect(Object.values(t.s.punti).reduce((a, b) => a + b, 0)).toBe(2 * PUNTI.detective);
  });
});

describe('stanza e rete', () => {
  it('riconnessione con lo stesso dispositivo; niente ingressi a partita iniziata', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco']);
    const nuovo = t.stanza.entraGiocatore({ nickname: 'Sara', idDispositivo: 'telefono-di-sara' });
    expect(nuovo.ok).toBe(true);
    const di = t.stanza.entraGiocatore({ idDispositivo: 'telefono-di-sara' });
    expect(di).toMatchObject({ ok: true, nuovo: false, nickname: 'Sara' });
    expect(t.stanza.entraGiocatore({ nickname: 'sara' })).toMatchObject({ ok: false });
    t.master({ tipo: 'avviaPartita' });
    expect(t.stanza.entraGiocatore({ nickname: 'Paolo' })).toMatchObject({ ok: false });
  });

  it('il Master toglie qualcuno solo in lobby, e mai se stesso', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco', 'Sara']);
    expect(t.master({ tipo: 'rimuoviGiocatore', id: t.id('Giulia') }).ok).toBe(false);
    expect(t.da('Luca', { tipo: 'rimuoviGiocatore', id: t.id('Sara') }).ok).toBe(false);
    const sara = t.id('Sara');
    expect(t.master({ tipo: 'rimuoviGiocatore', id: sara })).toEqual({ ok: true, espulsi: [sara] });
    expect(t.s.giocatori).toHaveLength(3);
  });

  it('dalla rete non arrivano comandi riservati a chi ospita', () => {
    expect(validaComando({ tipo: 'aggiungiGiocatore', id: 'x', nome: 'x' })).toBe(null);
    expect(validaComando({ tipo: 'scadenza' })).toBe(null);
    expect(validaComando({ tipo: 'voto', bersaglio: 3 })).toBe(null);
    expect(validaComando({ tipo: 'voto', bersaglio: 'g_1', extra: 1 })).toEqual({ tipo: 'voto', bersaglio: 'g_1' });
  });

  it('serializza e riprende la partita', () => {
    const t = tavolo(['Giulia', 'Luca', 'Marco']);
    t.master({ tipo: 'avviaPartita' });
    const copia = Stanza.deserializza(t.stanza.serializza());
    expect(copia.stato).toEqual(t.stanza.stato);
    expect(copia.verificaMaster(t.stanza.tokenMaster)).toBe(true);
  });
});

describe('confronto delle parole', () => {
  it('ignora maiuscole, accenti e spazi; tollera un errore dalle 5 lettere', () => {
    expect(paroleUguali('TIRAMISU', 'tiramisù')).toBe(true);
    expect(paroleUguali('pannacotta', 'panna cotta')).toBe(true);
    expect(paroleUguali('spiagia', 'spiaggia')).toBe(true);
    expect(paroleUguali('lago', 'mago')).toBe(false);
    expect(paroleUguali('', 'mare')).toBe(false);
  });

  it('la propria parola si riconosce anche dentro l\'indizio, ma non le parole cortissime', () => {
    expect(contieneParola('spiaggia libera', 'spiaggia')).toBe(true);
    expect(contieneParola('pizzeriadasotto', 'pizzeria')).toBe(true);
    expect(contieneParola('EX', 'ex')).toBe(true);
    expect(contieneParola('sexy', 'ex')).toBe(false);
    expect(contieneParola('torre', 're')).toBe(false);
  });
});
