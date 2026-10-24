import { useSyncExternalStore } from 'react';

// Router minimo basato sull'hash: https://…/impostore/#/g/K4XPQ
// Funziona su qualsiasi hosting statico (GitHub Pages compreso) senza configurare nulla.

function percorsoAttuale(): string {
  return window.location.hash.replace(/^#/, '') || '/';
}

function iscriviti(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function usePercorso(): string {
  return useSyncExternalStore(iscriviti, percorsoAttuale);
}

export function vai(percorso: string, sostituisci = false): void {
  const url = `${window.location.pathname}${window.location.search}#${percorso}`;
  if (sostituisci) {
    history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = percorso;
  }
}

/** Indirizzo completo (da mettere nel QR e nell'invito) per entrare nella stanza `codice`. */
export function linkStanza(codice: string): string {
  return `${window.location.origin}${window.location.pathname}#/g/${codice}`;
}
