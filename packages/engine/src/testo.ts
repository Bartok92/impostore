// Confronto "tollerante" fra parole: per il tentativo di Mr. White e per vietare di dire la propria parola.

/** Minuscole, senza accenti, spazi, apostrofi e segni: "Panna cotta" → "pannacotta". */
export function normalizzaParola(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Distanza di Levenshtein (inserimenti, cancellazioni, sostituzioni). */
export function distanza(a: string, b: string): number {
  if (a === b) return 0;
  let prec = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const riga = [i];
    for (let j = 1; j <= b.length; j++) {
      riga[j] = Math.min(prec[j]! + 1, riga[j - 1]! + 1, prec[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prec = riga;
  }
  return prec[b.length]!;
}

/** Stessa parola? Ammette un errore di battitura dalle 5 lettere in su. */
export function paroleUguali(tentativo: string, parola: string): boolean {
  const a = normalizzaParola(tentativo);
  const b = normalizzaParola(parola);
  if (!a) return false;
  return a === b || (b.length >= 5 && distanza(a, b) <= 1);
}

/** L'indizio contiene la parola segreta? ("spiaggia libera" con parola "spiaggia" → sì) */
export function contieneParola(indizio: string, parola: string): boolean {
  const p = normalizzaParola(parola);
  if (!p) return false;
  return indizio.split(/\s+/).some((pezzo) => paroleUguali(pezzo, parola)) || normalizzaParola(indizio).includes(p);
}

/** Pulisce un testo scritto da un giocatore: spazi in eccesso via, lunghezza massima. */
export function pulisciTesto(s: string, max: number): string {
  return s.replace(/\s+/g, ' ').trim().slice(0, max);
}
