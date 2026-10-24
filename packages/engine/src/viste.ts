import { composizione, type Composizione, type Impostazioni } from './impostazioni.js';
import type { IdCategoria } from './parole.js';
import { inGioco, parolaDi, viviDi, type Indizio, type StatoStanza, type Verdetto, type Vittoria } from './stato.js';
import type { Fase, IdGiocatore, Ruolo } from './tipi.js';

// Cosa può vedere ogni giocatore. Tutto ciò che esce da chi ospita passa da qui:
// ognuno riceve solo la propria carta; ruoli e parole degli altri si scoprono con le eliminazioni o a fine partita.

export interface GiocatoreVisto {
  id: IdGiocatore;
  nome: string;
  master: boolean;
  punti: number;
  /** Partecipa alla partita in corso? */
  inPartita: boolean;
  /** Ancora in gioco (non eliminato)? */
  inGioco: boolean;
  /** Ruolo, solo se già rivelato (eliminato, oppure fine partita). */
  ruolo: Ruolo | null;
}

export interface MiaCarta {
  /** Il ruolo come lo vede il giocatore (l'impostore inconsapevole si vede "detective"). */
  ruolo: Ruolo;
  parola: string | null;
  inGioco: boolean;
}

export interface VistaPartita {
  numero: number;
  impostazioni: Impostazioni;
  categoria: IdCategoria;
  composizione: Composizione;
  mia: MiaCarta | null;
  ordine: IdGiocatore[];
  visto: IdGiocatore[];
  giro: number;
  passaggio: number;
  parlanti: IdGiocatore[];
  turno: number;
  /** Chi deve parlare adesso (fase indizi). */
  parla: IdGiocatore | null;
  /** Tempo rimasto del turno, al momento dell'invio. */
  rimanenteMs: number | null;
  indizi: Indizio[];
  inGioco: IdGiocatore[];
  hannoVotato: IdGiocatore[];
  mioVoto: IdGiocatore | null;
  candidati: IdGiocatore[] | null;
  verdetto: Verdetto | null;
  /** C'è un vincitore (si sa già durante il verdetto, i dettagli solo a fine partita). */
  finita: boolean;
  vittoria: Vittoria | null;
  parole: { detective: string; impostore: string } | null;
}

export interface Vista {
  io: IdGiocatore;
  master: boolean;
  idMaster: IdGiocatore | null;
  fase: Fase;
  giocatori: GiocatoreVisto[];
  impostazioni: Impostazioni;
  partiteGiocate: number;
  partita: VistaPartita | null;
}

export function vistaPer(s: StatoStanza, io: IdGiocatore, ora: number): Vista {
  const p = s.partita;
  const fine = s.fase === 'fine';
  const rivelato = (id: IdGiocatore): Ruolo | null => {
    if (!p || !(id in p.ruoli)) return null;
    if (fine) return p.ruoli[id]!;
    return p.eliminati.find((e) => e.id === id)?.ruolo ?? null;
  };

  let partita: VistaPartita | null = null;
  if (p) {
    let mia: MiaCarta | null = null;
    const vero = p.ruoli[io];
    if (vero) {
      const ancora = inGioco(p, io);
      const nascosto = vero === 'impostore' && p.impostazioni.inconsapevole && ancora && !fine;
      mia = { ruolo: nascosto ? 'detective' : vero, parola: parolaDi(p, vero), inGioco: ancora };
    }
    partita = {
      numero: p.numero,
      impostazioni: p.impostazioni,
      categoria: p.categoria,
      composizione: composizione(p.ordine.length, p.impostazioni),
      mia,
      ordine: p.ordine,
      visto: p.visto,
      giro: p.giro,
      passaggio: p.passaggio,
      parlanti: p.parlanti,
      turno: p.turno,
      parla: s.fase === 'indizi' ? (p.parlanti[p.turno] ?? null) : null,
      rimanenteMs: p.fineTurnoA === null ? null : Math.max(0, p.fineTurnoA - ora),
      indizi: p.indizi,
      inGioco: viviDi(p),
      hannoVotato: Object.keys(p.voti),
      mioVoto: p.voti[io] ?? null,
      candidati: p.candidati,
      verdetto: p.verdetto,
      finita: p.vittoria !== null,
      vittoria: fine ? p.vittoria : null,
      parole: fine ? { detective: p.parolaDetective, impostore: p.parolaImpostore } : null,
    };
  }

  return {
    io,
    master: io === s.idMaster,
    idMaster: s.idMaster,
    fase: s.fase,
    giocatori: s.giocatori.map((g) => ({
      id: g.id,
      nome: g.nome,
      master: g.id === s.idMaster,
      punti: s.punti[g.id] ?? 0,
      inPartita: !!p && g.id in p.ruoli,
      inGioco: !!p && inGioco(p, g.id),
      ruolo: rivelato(g.id),
    })),
    impostazioni: s.impostazioni,
    partiteGiocate: s.partiteGiocate,
    partita,
  };
}
