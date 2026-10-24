// Memoria locale del dispositivo. localStorage può mancare o lanciare eccezioni
// (navigazione privata, dati bloccati): ogni accesso è protetto.
//
// Per provare più giocatori nello stesso browser: aggiungi ?prova=2 (3, 4…) all'indirizzo.
// Ogni numero è un "telefono" diverso, con la sua identità.

const prova = new URLSearchParams(window.location.search).get('prova');
const PREFISSO = prova && /^\w{1,8}$/.test(prova) ? `impostore.prova${prova}.` : 'impostore.';

function leggi<T>(chiave: string, predefinito: T): T {
  try {
    const v = localStorage.getItem(PREFISSO + chiave);
    return v ? (JSON.parse(v) as T) : predefinito;
  } catch {
    return predefinito;
  }
}

function scrivi(chiave: string, valore: unknown): void {
  try {
    localStorage.setItem(PREFISSO + chiave, JSON.stringify(valore));
  } catch {
    // niente memoria: si continua senza
  }
}

/** Id casuale. crypto.randomUUID esiste solo in contesti sicuri (HTTPS), getRandomValues ovunque. */
function idCasuale(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})/, '$1-$2-$3-$4-');
}

export const archivio = {
  idDispositivo(): string {
    let id = leggi<string | null>('dispositivo', null);
    if (!id) scrivi('dispositivo', (id = idCasuale()));
    return id;
  },

  tokenGiocatore(codice: string): string | undefined {
    return leggi<Record<string, string>>('sessioni', {})[codice];
  },
  salvaTokenGiocatore(codice: string, token: string): void {
    scrivi('sessioni', { ...leggi<Record<string, string>>('sessioni', {}), [codice]: token });
  },
  dimenticaGiocatore(codice: string): void {
    const s = leggi<Record<string, string>>('sessioni', {});
    delete s[codice];
    scrivi('sessioni', s);
  },

  tokenMaster(codice: string): string | undefined {
    return leggi<Record<string, string>>('master', {})[codice];
  },
  salvaTokenMaster(codice: string, token: string): void {
    scrivi('master', { ...leggi<Record<string, string>>('master', {}), [codice]: token });
  },

  ultimoNickname(): string {
    return leggi('nickname', '');
  },
  salvaNickname(n: string): void {
    scrivi('nickname', n);
  },
};
