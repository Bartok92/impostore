import { mescola } from './casuale.js';
import { aggiornaImpostazioni, composizione, MAX_GIOCATORI, problemiComposizione, type Impostazioni } from './impostazioni.js';
import { CATEGORIE, categoria, idCoppia } from './parole.js';
import { inGioco, parolaDi, viviDi, type Partita, type StatoStanza, type Verdetto, type Vittoria } from './stato.js';
import { contieneParola, paroleUguali, pulisciTesto } from './testo.js';
import type { Attore, Casuale, IdGiocatore, Ruolo } from './tipi.js';

// Il motore: applica un comando allo stato e restituisce il nuovo stato (oppure un errore).
// Puro: niente I/O, niente orologio né casualità propri (arrivano dal contesto). Regole in RULES.md.

export const MAX_NOME = 20;
export const MAX_INDIZIO = 30;
export const MAX_TENTATIVO = 40;

export const PUNTI = { detective: 2, infiltrato: 3, mrWhiteIndovina: 5 } as const;

export type Comando =
  // Solo da chi ospita (entrata nella stanza, scadenza dei turni): non arrivano mai dalla rete.
  | { tipo: 'aggiungiGiocatore'; id: IdGiocatore; nome: string; master?: boolean }
  | { tipo: 'scadenza' }
  // Master
  | { tipo: 'rimuoviGiocatore'; id: IdGiocatore }
  | { tipo: 'impostaImpostazioni'; impostazioni: Partial<Impostazioni> }
  | { tipo: 'avviaPartita' }
  | { tipo: 'iniziaIndizi' }
  | { tipo: 'saltaTurno' }
  | { tipo: 'chiudiVoto' }
  | { tipo: 'prosegui' }
  | { tipo: 'tornaAllaLobby' }
  // Giocatori
  | { tipo: 'confermaVisto' }
  | { tipo: 'indizio'; testo: string | null }
  | { tipo: 'voto'; bersaglio: IdGiocatore }
  | { tipo: 'indovina'; testo: string };

export interface Contesto {
  casuale: Casuale;
  /** Orologio di chi ospita (ms). */
  ora: number;
}

export type EsitoApplica = { ok: true; stato: StatoStanza } | { ok: false; errore: string };

export function applica(stato: StatoStanza, attore: Attore, c: Comando, ctx: Contesto): EsitoApplica {
  const s = JSON.parse(JSON.stringify(stato)) as StatoStanza;
  const errore = esegui(s, attore, c, ctx);
  return errore ? { ok: false, errore } : { ok: true, stato: s };
}

function esegui(s: StatoStanza, attore: Attore, c: Comando, ctx: Contesto): string | null {
  const io = attore.tipo === 'giocatore' ? attore.id : null;
  const master = io !== null && io === s.idMaster;
  const p = s.partita;

  switch (c.tipo) {
    case 'aggiungiGiocatore': {
      if (attore.tipo !== 'sistema') return 'Non permesso.';
      if (s.fase !== 'lobby') return 'La partita è già iniziata: aspetta la prossima.';
      if (s.giocatori.length >= MAX_GIOCATORI) return 'La stanza è piena.';
      const nome = pulisciTesto(c.nome, MAX_NOME);
      if (!nome) return 'Scrivi il tuo nome.';
      if (s.giocatori.some((g) => g.nome.toLocaleLowerCase('it') === nome.toLocaleLowerCase('it')))
        return `C'è già qualcuno che si chiama ${nome}: scegli un altro nome.`;
      s.giocatori.push({ id: c.id, nome });
      s.punti[c.id] ??= 0;
      if (c.master) s.idMaster = c.id;
      return null;
    }

    case 'rimuoviGiocatore': {
      if (!master) return 'Solo il Master può farlo.';
      if (s.fase !== 'lobby') return 'Si possono togliere giocatori solo nella stanza d\'attesa.';
      if (c.id === s.idMaster) return 'Il Master non può uscire dalla sua stanza.';
      if (!s.giocatori.some((g) => g.id === c.id)) return 'Giocatore non trovato.';
      s.giocatori = s.giocatori.filter((g) => g.id !== c.id);
      delete s.punti[c.id];
      return null;
    }

    case 'impostaImpostazioni': {
      if (!master) return 'Solo il Master può farlo.';
      if (s.fase !== 'lobby') return 'Le modalità si cambiano nella stanza d\'attesa.';
      s.impostazioni = aggiornaImpostazioni(s.impostazioni, c.impostazioni);
      return null;
    }

    case 'avviaPartita': {
      if (!master) return 'Solo il Master può farlo.';
      if (s.fase !== 'lobby' && s.fase !== 'fine') return 'La partita è già in corso.';
      const problemi = problemiComposizione(s.giocatori.length, s.impostazioni);
      if (problemi.length) return problemi[0]!;
      avvia(s, ctx);
      return null;
    }

    case 'tornaAllaLobby': {
      if (!master) return 'Solo il Master può farlo.';
      if (s.fase === 'lobby') return 'Siete già nella stanza d\'attesa.';
      s.partita = null;
      s.fase = 'lobby';
      return null;
    }
  }

  // Da qui in poi serve una partita in corso.
  if (!p) return 'Nessuna partita in corso.';

  switch (c.tipo) {
    case 'confermaVisto': {
      if (s.fase !== 'parola') return 'Le carte sono già state viste.';
      if (!io || !(io in p.ruoli)) return 'Non sei in questa partita.';
      if (!p.visto.includes(io)) p.visto.push(io);
      if (p.ordine.every((id) => p.visto.includes(id))) iniziaGiro(s, ctx);
      return null;
    }

    case 'iniziaIndizi': {
      if (!master) return 'Solo il Master può farlo.';
      if (s.fase !== 'parola') return 'Gli indizi sono già iniziati.';
      iniziaGiro(s, ctx);
      return null;
    }

    case 'indizio': {
      if (s.fase !== 'indizi') return 'Non è il momento degli indizi.';
      if (io !== p.parlanti[p.turno]) return 'Non è il tuo turno.';
      const testo = c.testo === null ? '' : pulisciTesto(c.testo, MAX_INDIZIO);
      const parola = parolaDi(p, p.ruoli[io]!);
      if (testo && parola && contieneParola(testo, parola)) return 'Non puoi scrivere la tua parola segreta!';
      registraIndizio(s, ctx, testo || null, testo ? 'scritto' : 'aVoce');
      return null;
    }

    case 'saltaTurno': {
      if (!master) return 'Solo il Master può farlo.';
      if (s.fase === 'indizi') registraIndizio(s, ctx, null, 'saltato');
      else if (s.fase === 'mrwhite') esitoMrWhite(s, '', false);
      else return 'Non c\'è nessun turno da saltare.';
      return null;
    }

    case 'scadenza': {
      if (attore.tipo !== 'sistema') return 'Non permesso.';
      if (p.fineTurnoA === null || ctx.ora < p.fineTurnoA) return 'Il tempo non è ancora scaduto.';
      if (s.fase === 'indizi') registraIndizio(s, ctx, null, 'tempo');
      else if (s.fase === 'mrwhite') esitoMrWhite(s, '', false);
      else return 'Nessun turno a tempo.';
      return null;
    }

    case 'voto': {
      if (s.fase !== 'voto') return 'Non si sta votando.';
      if (!io || !inGioco(p, io)) return 'Sei fuori dal gioco: guarda gli altri votare.';
      if (c.bersaglio === io) return 'Non puoi votare te stesso.';
      if (!inGioco(p, c.bersaglio)) return 'Questo giocatore non è più in gioco.';
      if (p.candidati && !p.candidati.includes(c.bersaglio)) return 'Al ballottaggio si vota solo uno dei candidati.';
      p.voti[io] = c.bersaglio;
      if (viviDi(p).every((id) => id in p.voti)) chiudiVoto(s, ctx);
      return null;
    }

    case 'chiudiVoto': {
      if (!master) return 'Solo il Master può farlo.';
      if (s.fase !== 'voto') return 'Non si sta votando.';
      if (Object.keys(p.voti).length === 0) return 'Nessuno ha ancora votato.';
      chiudiVoto(s, ctx);
      return null;
    }

    case 'indovina': {
      if (s.fase !== 'mrwhite') return 'Non è il momento di indovinare.';
      if (!io || io !== p.verdetto?.eliminato) return 'Solo Mr. White può indovinare.';
      const testo = pulisciTesto(c.testo, MAX_TENTATIVO);
      if (!testo) return 'Scrivi una parola.';
      esitoMrWhite(s, testo, paroleUguali(testo, p.parolaDetective));
      return null;
    }

    case 'prosegui': {
      if (!master) return 'Solo il Master può farlo.';
      if (s.fase !== 'verdetto') return 'Non c\'è un verdetto da chiudere.';
      if (p.vittoria) {
        for (const [id, punti] of Object.entries(p.vittoria.punti)) s.punti[id] = (s.punti[id] ?? 0) + punti;
        s.partiteGiocate++;
        s.fase = 'fine';
      } else if (p.candidati) {
        apriVoto(s, p.candidati);
      } else {
        p.giro++;
        iniziaGiro(s, ctx);
      }
      return null;
    }
  }
  return 'Comando sconosciuto.';
}

// ——— Inizio partita ———

function scegliCoppia(s: StatoStanza, casuale: Casuale) {
  const cats = s.impostazioni.categoria === 'casuale' ? CATEGORIE : [categoria(s.impostazioni.categoria)];
  const tutte = cats.flatMap((c) => c.coppie.map((coppia, i) => ({ cat: c.id, id: idCoppia(c.id, i), coppia })));
  let libere = tutte.filter((x) => !s.coppieUsate.includes(x.id));
  if (libere.length === 0) {
    // Finite le parole di questa categoria: si ricomincia a pescarle tutte.
    const ids = new Set(tutte.map((x) => x.id));
    s.coppieUsate = s.coppieUsate.filter((id) => !ids.has(id));
    libere = tutte;
  }
  const scelta = libere[Math.floor(casuale() * libere.length)]!;
  s.coppieUsate.push(scelta.id);
  return scelta;
}

function avvia(s: StatoStanza, ctx: Contesto): void {
  const imp = { ...s.impostazioni };
  const ids = s.giocatori.map((g) => g.id);
  const comp = composizione(ids.length, imp);
  const ruoli: Record<IdGiocatore, Ruolo> = {};
  mescola(ids, ctx.casuale).forEach((id, i) => {
    ruoli[id] = i < comp.impostori ? 'impostore' : i < comp.impostori + comp.mrWhite ? 'mrwhite' : 'detective';
  });
  const scelta = scegliCoppia(s, ctx.casuale);
  const [a, b] = scelta.coppia;
  const scambia = ctx.casuale() < 0.5;
  const partita: Partita = {
    numero: s.partiteGiocate + 1,
    impostazioni: imp,
    categoria: scelta.cat,
    coppia: scelta.id,
    parolaDetective: scambia ? b : a,
    parolaImpostore: scambia ? a : b,
    ruoli,
    ordine: mescola(ids, ctx.casuale),
    eliminati: [],
    visto: [],
    giro: 1,
    passaggio: 1,
    parlanti: [],
    turno: 0,
    fineTurnoA: null,
    indizi: [],
    voti: {},
    candidati: null,
    verdetto: null,
    vittoria: null,
  };
  s.partita = partita;
  s.fase = 'parola';
}

// ——— Indizi ———

function avviaTimer(p: Partita, ctx: Contesto): void {
  p.fineTurnoA = p.impostazioni.indiziATempo ? ctx.ora + p.impostazioni.secondiIndizio * 1000 : null;
}

/** Nuovo giro di indizi: l'ordine ruota di un posto a ogni giro e Mr. White non parla mai per primo. */
function iniziaGiro(s: StatoStanza, ctx: Contesto): void {
  const p = s.partita!;
  const vivi = viviDi(p);
  let inizio = (p.giro - 1) % vivi.length;
  if (vivi.length > 1 && p.ruoli[vivi[inizio]!] === 'mrwhite') inizio = (inizio + 1) % vivi.length;
  p.parlanti = [...vivi.slice(inizio), ...vivi.slice(0, inizio)];
  p.passaggio = 1;
  p.turno = 0;
  p.voti = {};
  p.candidati = null;
  p.verdetto = null;
  s.fase = 'indizi';
  avviaTimer(p, ctx);
}

function registraIndizio(s: StatoStanza, ctx: Contesto, testo: string | null, esito: 'scritto' | 'aVoce' | 'tempo' | 'saltato'): void {
  const p = s.partita!;
  p.indizi.push({ id: p.parlanti[p.turno]!, giro: p.giro, passaggio: p.passaggio, testo, esito });
  p.turno++;
  if (p.turno < p.parlanti.length) return avviaTimer(p, ctx);
  if (p.impostazioni.doppioGiro && p.passaggio === 1) {
    p.passaggio = 2;
    p.turno = 0;
    return avviaTimer(p, ctx);
  }
  apriVoto(s, null);
}

// ——— Voto e verdetto ———

function apriVoto(s: StatoStanza, candidati: IdGiocatore[] | null): void {
  const p = s.partita!;
  s.fase = 'voto';
  p.voti = {};
  p.candidati = candidati;
  p.fineTurnoA = null;
}

function chiudiVoto(s: StatoStanza, ctx: Contesto): void {
  const p = s.partita!;
  const conteggi = new Map<IdGiocatore, number>();
  for (const b of Object.values(p.voti)) conteggi.set(b, (conteggi.get(b) ?? 0) + 1);
  const conteggio = p.ordine
    .filter((id) => conteggi.has(id))
    .map((id) => ({ id, voti: conteggi.get(id)! }))
    .sort((a, b) => b.voti - a.voti);
  const massimo = conteggio[0]!.voti;
  const primi = conteggio.filter((x) => x.voti === massimo).map((x) => x.id);
  const ballottaggio = p.candidati !== null;
  const base = { giro: p.giro, ballottaggio, conteggio, voti: { ...p.voti }, tentativo: null };
  p.voti = {};

  if (primi.length === 1) return elimina(s, ctx, primi[0]!, base);
  // Pareggio: si va al ballottaggio; se era già il ballottaggio, nessuno esce.
  p.verdetto = { ...base, esito: 'pareggio', eliminato: null, ruolo: null, pari: primi };
  p.candidati = ballottaggio ? null : primi;
  s.fase = 'verdetto';
}

function elimina(s: StatoStanza, ctx: Contesto, id: IdGiocatore, base: Pick<Verdetto, 'giro' | 'ballottaggio' | 'conteggio' | 'voti' | 'tentativo'>): void {
  const p = s.partita!;
  const ruolo = p.ruoli[id]!;
  p.eliminati.push({ id, giro: p.giro, ruolo });
  p.candidati = null;
  p.verdetto = { ...base, esito: 'eliminato', eliminato: id, ruolo, pari: [] };
  if (ruolo === 'mrwhite') {
    // Ultima chance: Mr. White prova a indovinare la parola dei detective.
    s.fase = 'mrwhite';
    avviaTimer(p, ctx);
    return;
  }
  p.vittoria = calcolaVittoria(p);
  s.fase = 'verdetto';
}

function esitoMrWhite(s: StatoStanza, testo: string, esatto: boolean): void {
  const p = s.partita!;
  p.verdetto!.tentativo = { testo, esatto };
  p.fineTurnoA = null;
  const mw = p.verdetto!.eliminato!;
  p.vittoria = esatto ? { squadra: 'mrwhite', vincitori: [mw], punti: { [mw]: PUNTI.mrWhiteIndovina } } : calcolaVittoria(p);
  s.fase = 'verdetto';
}

function vittoria(squadra: Vittoria['squadra'], vincitori: IdGiocatore[], punti: number): Vittoria {
  return { squadra, vincitori, punti: Object.fromEntries(vincitori.map((id) => [id, punti])) };
}

/** Vedi RULES.md, "Vittoria". */
export function calcolaVittoria(p: Partita): Vittoria | null {
  const vivi = viviDi(p);
  const detective = vivi.filter((id) => p.ruoli[id] === 'detective').length;
  const infiltrati = vivi.length - detective;
  const con = (f: (r: Ruolo) => boolean) => p.ordine.filter((id) => f(p.ruoli[id]!));
  if (infiltrati === 0) return vittoria('detective', con((r) => r === 'detective'), PUNTI.detective);
  if (detective <= infiltrati) return vittoria('infiltrati', con((r) => r !== 'detective'), PUNTI.infiltrato);
  return null;
}
