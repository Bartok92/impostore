// Tipi di base condivisi dal motore e dal client.

export type IdGiocatore = string;

/** Detective: ha la parola. Impostore: parola simile. Mr. White: nessuna parola. */
export type Ruolo = 'detective' | 'impostore' | 'mrwhite';

export type Fase = 'lobby' | 'parola' | 'indizi' | 'voto' | 'verdetto' | 'mrwhite' | 'fine';

/** Generatore casuale iniettato dall'esterno: restituisce un numero in [0, 1). */
export type Casuale = () => number;

/** Chi invia un comando al motore: un giocatore (il Master è un giocatore) oppure chi ospita (timer). */
export type Attore = { tipo: 'giocatore'; id: IdGiocatore } | { tipo: 'sistema' };

export const SISTEMA: Attore = { tipo: 'sistema' };
export const giocatore = (id: IdGiocatore): Attore => ({ tipo: 'giocatore', id });
