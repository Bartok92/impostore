import type { GiocatoreVisto, IdGiocatore, Ruolo, Vista } from '@impostore/engine';

/** Colori degli avatar: diversi dai tre colori dei ruoli, per non confondere. */
const COLORI_AVATAR = ['#4CC9F0', '#FF9F43', '#A3E635', '#F472B6', '#2DD4BF', '#9B8CFF', '#60A5FA', '#FB923C', '#C084FC', '#34D399'];

export function coloreDi(v: Pick<Vista, 'giocatori'>, id: IdGiocatore): string {
  const i = v.giocatori.findIndex((g) => g.id === id);
  return COLORI_AVATAR[(i < 0 ? 0 : i) % COLORI_AVATAR.length]!;
}

export function giocatoreDi(v: Pick<Vista, 'giocatori'>, id: IdGiocatore | null | undefined): GiocatoreVisto | undefined {
  return id ? v.giocatori.find((g) => g.id === id) : undefined;
}

export function nomeDi(v: Pick<Vista, 'giocatori'>, id: IdGiocatore | null | undefined): string {
  return giocatoreDi(v, id)?.nome ?? '?';
}

export function elenco(nomi: string[]): string {
  if (nomi.length === 0) return 'nessuno';
  if (nomi.length === 1) return nomi[0]!;
  return `${nomi.slice(0, -1).join(', ')} e ${nomi[nomi.length - 1]}`;
}

export function plurale(n: number, singolare: string, plurale: string): string {
  return `${n} ${n === 1 ? singolare : plurale}`;
}

export const NOME_RUOLO: Record<Ruolo, string> = { detective: 'Detective', impostore: 'Impostore', mrwhite: 'Mr. White' };

/** Colore di sfondo e del testo per ogni ruolo. */
export const COLORE_RUOLO: Record<Ruolo, { sfondo: string; testo: string }> = {
  detective: { sfondo: 'bg-detective', testo: 'text-detective' },
  impostore: { sfondo: 'bg-impostore', testo: 'text-impostore' },
  mrwhite: { sfondo: 'bg-mrwhite', testo: 'text-mrwhite' },
};

/** "Luca era L'IMPOSTORE" / "UN IMPOSTORE" se sono più d'uno. */
export function ruoloRivelato(ruolo: Ruolo, quantiImpostori: number): string {
  if (ruolo === 'detective') return 'DETECTIVE';
  if (ruolo === 'mrwhite') return 'MR. WHITE';
  return quantiImpostori > 1 ? 'UN IMPOSTORE' : 'L\'IMPOSTORE';
}

/** Vibrazione breve (se il telefono la supporta). */
export function vibra(schema: number | number[] = 200): void {
  try {
    navigator.vibrate?.(schema);
  } catch {
    // vibrazione non disponibile
  }
}
