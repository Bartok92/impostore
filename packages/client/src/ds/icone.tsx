import type { ReactNode } from 'react';

// Icone a tratto (stesse del design). Decorative: nascoste agli screen reader,
// il significato lo porta sempre il testo o l'aria-label del pulsante.

function Icona({ children, size = 20, spessore = 2, className }: { children: ReactNode; size?: number; spessore?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={spessore} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

type P = { size?: number; className?: string };

export const IconaPiu = (p: P) => <Icona {...p} spessore={2.4}><path d="M12 5v14M5 12h14" /></Icona>;
export const IconaScansiona = (p: P) => <Icona {...p}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8" /></Icona>;
export const IconaIndietro = (p: P) => <Icona {...p} spessore={2.2}><path d="M15 18l-6-6 6-6" /></Icona>;
export const IconaAvanti = (p: P) => <Icona {...p} spessore={2.4}><path d="M5 12h14M13 6l6 6-6 6" /></Icona>;
export const IconaWhatsapp = (p: P) => <Icona {...p}><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.2 1.8.9" /></Icona>;
export const IconaCopia = (p: P) => <Icona {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h9" /></Icona>;
export const IconaOcchio = (p: P) => <Icona {...p}><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="3" /></Icona>;
export const IconaOcchioBarrato = (p: P) => <Icona {...p} spessore={2.2}><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 3.8M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 19 12 19c1.8 0 3.3-.6 4.6-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Icona>;
export const IconaLucchetto = (p: P) => <Icona {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icona>;
export const IconaLampadina = (p: P) => <Icona {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></Icona>;
export const IconaFantasma = (p: P) => <Icona {...p} spessore={1.8}><path d="M6 20V10a6 6 0 0 1 12 0v10l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z" /><path d="M10 10h.01M14 10h.01" /></Icona>;
export const IconaScambia = (p: P) => <Icona {...p}><path d="M7 7h10M7 12h6M17 14l3 3-3 3M20 17H12" /></Icona>;
export const IconaOrologio = (p: P) => <Icona {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M10 2h4" /></Icona>;
export const IconaRipeti = (p: P) => <Icona {...p}><path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" /></Icona>;
export const IconaSpunta = (p: P) => <Icona {...p} spessore={3}><path d="M5 12l5 5 9-10" /></Icona>;
export const IconaCroce = (p: P) => <Icona {...p} spessore={2.4}><path d="M6 6l12 12M18 6L6 18" /></Icona>;
export const IconaMenu = (p: P) => <Icona {...p} spessore={2.6}><path d="M5 12h.01M12 12h.01M19 12h.01" /></Icona>;
export const IconaLente = (p: P) => <Icona {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Icona>;
export const IconaMicrofono = (p: P) => <Icona {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Icona>;
export const IconaSalta = (p: P) => <Icona {...p}><path d="M5 5l8 7-8 7zM17 5v14" /></Icona>;
export const IconaCorona = (p: P) => <Icona {...p}><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" /></Icona>;
export const IconaFiamma = (p: P) => <Icona {...p}><path d="M12 22a7 7 0 0 0 7-7c0-4-3-6.5-4-10-2.5 2-3.5 4-3.5 6.5-1-.8-1.8-2-2-3.5C7.5 10 5 12.3 5 15a7 7 0 0 0 7 7z" /></Icona>;

export function IconaPlay({ size = 20 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
    </svg>
  );
}
