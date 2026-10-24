import { useState } from 'react';
import type { PacchettoVista } from '@impostore/engine';
import { Foglio, Pulsante } from '../ds/componenti';
import { IconaMenu, IconaOcchio } from '../ds/icone';
import { useApp } from '../store';
import { CartaRuolo, FaseCarta } from './Carta';
import { FaseFine } from './Fine';
import { FaseIndizi } from './Indizi';
import { Lobby } from './Lobby';
import { FaseMrWhite } from './MrWhite';
import { FaseVerdetto } from './Verdetto';
import { FaseVoto } from './Voto';

/** Lo schermo di gioco, uguale per tutti: il Master ha in più i pulsanti per guidare la partita. */
export function SchermoGioco({ pacchetto }: { pacchetto: PacchettoVista }) {
  const v = pacchetto.vista;
  const connesso = useApp((s) => s.connesso);

  let fase;
  switch (v.fase) {
    case 'lobby': fase = <Lobby pacchetto={pacchetto} />; break;
    case 'parola': fase = <FaseCarta v={v} />; break;
    case 'indizi': fase = <FaseIndizi v={v} />; break;
    case 'voto': fase = <FaseVoto v={v} />; break;
    case 'verdetto': fase = <FaseVerdetto v={v} />; break;
    case 'mrwhite': fase = <FaseMrWhite v={v} />; break;
    case 'fine': fase = <FaseFine v={v} />; break;
  }

  return (
    <>
      {!connesso && (
        <div role="status" className="sticky top-0 z-40 bg-impostore px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-center text-sm font-bold text-inchiostro">
          {v.master ? 'La stanza non è raggiungibile in rete: riprovo…' : 'Collegamento perso con il Master: mi ricollego…'}
        </div>
      )}
      {fase}
    </>
  );
}

/** Riga in alto durante la partita: a che punto siamo, la propria carta, il menu del Master. */
export function BarraPartita({ v, titolo }: { v: PacchettoVista['vista']; titolo: string }) {
  const invia = useApp((s) => s.invia);
  const [carta, setCarta] = useState(false);
  const [menu, setMenu] = useState(false);
  const p = v.partita!;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold uppercase tracking-[1.5px] text-tenue">{titolo}</span>
      <div className="flex gap-2">
        {p.mia && (
          <button
            type="button"
            onClick={() => setCarta(true)}
            className="flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-bordo px-3 text-[13px] font-bold"
          >
            <IconaOcchio size={16} /> Parola
          </button>
        )}
        {v.master && (
          <button type="button" aria-label="Menu del Master" onClick={() => setMenu(true)} className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-bordo">
            <IconaMenu size={18} />
          </button>
        )}
      </div>
      <Foglio aperto={carta} onChiudi={() => setCarta(false)} titolo="La tua carta">
        {p.mia && <CartaRuolo carta={p.mia} categoria={p.categoria} compatta />}
        <Pulsante className="mt-4" onClick={() => setCarta(false)}>Nascondi</Pulsante>
      </Foglio>
      <Foglio aperto={menu} onChiudi={() => setMenu(false)} titolo="Menu del Master">
        <p className="mb-4 mt-0 text-tenue">Si torna alla stanza d'attesa: la partita in corso si chiude senza punti. Lì puoi cambiare le modalità e far entrare altri amici.</p>
        <Pulsante
          variante="corallo"
          onClick={() => {
            if (!confirm('Terminare la partita in corso?')) return;
            setMenu(false);
            void invia({ tipo: 'tornaAllaLobby' });
          }}
        >
          Termina la partita
        </Pulsante>
      </Foglio>
    </div>
  );
}
