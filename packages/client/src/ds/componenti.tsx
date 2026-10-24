import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { IconaCroce } from './icone';

// I mattoncini dell'interfaccia, presi dal design: fondo scuro, schede viola, un colore per ruolo.

const VARIANTI = {
  giallo: 'bg-detective text-inchiostro font-titolo',
  corallo: 'bg-impostore text-inchiostro font-titolo',
  bianco: 'bg-mrwhite text-inchiostro font-titolo',
  whatsapp: 'bg-whatsapp text-whatsapp-scuro font-testo',
  contorno: 'border-[1.5px] border-bordo bg-fondo text-testo font-titolo',
  contornoTesto: 'border-[1.5px] border-bordo bg-fondo text-testo font-testo',
  spento: 'bg-superficie-2 text-spento font-titolo',
} as const;

const MISURE = {
  grande: 'h-15 w-full rounded-[18px] px-5 text-base',
  medio: 'h-13 w-full rounded-2xl px-4 text-[15px]',
  piccolo: 'h-11 rounded-2xl px-4 text-sm',
} as const;

type PropsPulsante = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof VARIANTI;
  misura?: keyof typeof MISURE;
};

export function Pulsante({ variante = 'giallo', misura = 'grande', className = '', disabled, children, ...resto }: PropsPulsante) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex items-center justify-center gap-2.5 text-center leading-tight font-bold transition active:scale-[0.98] disabled:opacity-45 [&>svg]:shrink-0 ${MISURE[misura]} ${VARIANTI[variante]} ${className}`}
      {...resto}
    >
      {children}
    </button>
  );
}

export function PulsanteIcona({ etichetta, children, className = '', ...resto }: ButtonHTMLAttributes<HTMLButtonElement> & { etichetta: string }) {
  return (
    <button
      type="button"
      aria-label={etichetta}
      title={etichetta}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-bordo text-testo active:scale-95 ${className}`}
      {...resto}
    >
      {children}
    </button>
  );
}

export function Avatar({ nome, colore, misura = 42 }: { nome: string; colore: string; misura?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full font-titolo font-extrabold text-inchiostro"
      style={{ width: misura, height: misura, background: colore, fontSize: Math.round(misura * 0.38) }}
    >
      {nome.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

export function Scheda({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[20px] bg-superficie p-4 ${className}`}>{children}</div>;
}

export function Etichetta({ children, className = '', as: Tag = 'p' }: { children: ReactNode; className?: string; as?: 'p' | 'h2' | 'span' }) {
  return <Tag className={`m-0 text-xs font-bold uppercase tracking-[1.5px] text-tenue ${className}`}>{children}</Tag>;
}

/** Pagina a misura di telefono, centrata sugli schermi grandi. */
export function Schermo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={`relative mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] ${className}`}
    >
      {children}
    </main>
  );
}

export function Interruttore({ acceso, onCambia, etichetta, colore }: { acceso: boolean; onCambia: (v: boolean) => void; etichetta: string; colore: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acceso}
      aria-label={etichetta}
      onClick={() => onCambia(!acceso)}
      className="relative h-[30px] w-[52px] shrink-0 rounded-full p-0 transition-colors"
      style={{ background: acceso ? colore : 'var(--color-bordo)' }}
    >
      <span className="absolute top-[3px] h-6 w-6 rounded-full bg-white transition-[left]" style={{ left: acceso ? 25 : 3 }} />
    </button>
  );
}

/** Conto alla rovescia ad anello. */
export function Anello({ rimanenteMs, totaleMs, misura = 84, colore = '#110E1F', traccia = 'rgba(17,14,31,.15)' }: { rimanenteMs: number; totaleMs: number; misura?: number; colore?: string; traccia?: string }) {
  const r = misura / 2 - misura * 0.095;
  const giro = 2 * Math.PI * r;
  const frazione = totaleMs > 0 ? Math.min(1, rimanenteMs / totaleMs) : 0;
  const secondi = Math.ceil(rimanenteMs / 1000);
  return (
    <div role="img" aria-label={`${secondi} secondi rimasti`} className="relative shrink-0" style={{ width: misura, height: misura }}>
      <svg aria-hidden="true" width={misura} height={misura} viewBox={`0 0 ${misura} ${misura}`} className="-rotate-90">
        <circle cx={misura / 2} cy={misura / 2} r={r} fill="none" stroke={traccia} strokeWidth={misura * 0.095} />
        <circle
          cx={misura / 2} cy={misura / 2} r={r} fill="none" stroke={colore} strokeWidth={misura * 0.095} strokeLinecap="round"
          strokeDasharray={`${giro * frazione} ${giro}`} className="transition-[stroke-dasharray] duration-200"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-titolo font-extrabold" style={{ fontSize: misura * 0.21, color: colore }}>
        {Math.floor(secondi / 60)}:{String(secondi % 60).padStart(2, '0')}
      </span>
    </div>
  );
}

/** Pannello che sale dal basso (dialogo modale). */
export function Foglio({ aperto, onChiudi, titolo, children }: { aperto: boolean; onChiudi: () => void; titolo: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aperto) return;
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onChiudi();
    ref.current?.addEventListener('keydown', esc);
    const nodo = ref.current;
    return () => nodo?.removeEventListener('keydown', esc);
  }, [aperto, onChiudi]);
  if (!aperto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onChiudi}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titolo}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="compari max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-fondo px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 outline-none ring-1 ring-bordo"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="m-0 font-titolo text-lg font-bold">{titolo}</h2>
          <PulsanteIcona etichetta="Chiudi" onClick={onChiudi}>
            <IconaCroce size={18} />
          </PulsanteIcona>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Tre puntini che pulsano: "sta scrivendo…". */
export function Attesa({ testo }: { testo: string }) {
  return <span className="pulsa text-spento">{testo}</span>;
}
