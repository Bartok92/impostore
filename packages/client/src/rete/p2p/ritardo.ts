/**
 * Attese crescenti tra un tentativo di collegamento e l'altro: 3 s, 6 s, 12 s… fino a 1 minuto,
 * con un po' di casualità. Senza, tanti telefoni sulla stessa rete (stesso indirizzo internet)
 * riprovano tutti insieme ogni pochi secondi e il server pubblico di PeerJS li blocca ("429 Too Many Requests").
 */
export class Ritardo {
  private tentativi = 0;

  constructor(private baseMs: number, private massimoMs = 60_000) {}

  /** Quanto aspettare prima del prossimo tentativo (e conta il tentativo). */
  prossimo(): number {
    const ms = Math.min(this.massimoMs, this.baseMs * 2 ** this.tentativi);
    this.tentativi++;
    return Math.round(ms * (0.8 + Math.random() * 0.4));
  }

  /** Collegamento riuscito: la prossima volta si riparte dall'attesa più breve. */
  azzera(): void {
    this.tentativi = 0;
  }
}
