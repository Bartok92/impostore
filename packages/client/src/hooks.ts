import { useEffect, useState } from 'react';

/** Orologio che si aggiorna ogni `ms` millisecondi. */
export function useOra(ms = 1000): number {
  const [ora, setOra] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setOra(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return ora;
}

/** Millisecondi rimanenti di un conto alla rovescia ricevuto da chi ospita alle `ricevutoA`. */
export function useRimanente(rimanenteMs: number | null, ricevutoA: number): number | null {
  const ora = useOra(250);
  return rimanenteMs === null ? null : Math.max(0, rimanenteMs - (ora - ricevutoA));
}

type WakeLockSentinelMinimo = { release: () => Promise<void>; addEventListener: (t: 'release', f: () => void) => void };
type NavigatorWakeLock = Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelMinimo> } };

/** Tiene acceso lo schermo (Wake Lock API, solo in HTTPS o localhost): il telefono del Master tiene la partita. */
export function useWakeLock(attivo: boolean): void {
  useEffect(() => {
    const wl = (navigator as NavigatorWakeLock).wakeLock;
    if (!attivo || !wl || !window.isSecureContext) return;
    let sentinella: WakeLockSentinelMinimo | null = null;
    const richiedi = async () => {
      try {
        sentinella = await wl.request('screen');
      } catch {
        // rifiutato (batteria scarica, scheda in secondo piano): si riprova al ritorno
      }
    };
    const visibilita = () => document.visibilityState === 'visible' && void richiedi();
    void richiedi();
    document.addEventListener('visibilitychange', visibilita);
    return () => {
      document.removeEventListener('visibilitychange', visibilita);
      void sentinella?.release().catch(() => undefined);
    };
  }, [attivo]);
}
