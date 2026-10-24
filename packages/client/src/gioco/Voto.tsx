import { useEffect, useState } from 'react';
import type { Vista } from '@impostore/engine';
import { Avatar, Pulsante, Schermo } from '../ds/componenti';
import { IconaSpunta } from '../ds/icone';
import { useApp } from '../store';
import { coloreDi, elenco, nomeDi } from '../utilita';
import { testoIndizio } from './Indizi';
import { BarraPartita } from './SchermoGioco';

export function FaseVoto({ v }: { v: Vista }) {
  const invia = useApp((s) => s.invia);
  const p = v.partita!;
  const ballottaggio = p.candidati !== null;
  const votabili = (p.candidati ?? p.inGioco).filter((id) => id !== v.io);
  const inGioco = p.mia?.inGioco ?? false;
  const [scelto, setScelto] = useState<string | null>(p.mioVoto);
  useEffect(() => setScelto(p.mioVoto), [p.mioVoto]);
  const cambiato = scelto !== p.mioVoto;

  return (
    <Schermo className="gap-[18px]">
      <BarraPartita v={v} titolo={`${ballottaggio ? 'Ballottaggio' : 'Votazione'} · Giro ${p.giro}`} />
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-titolo text-[28px] font-extrabold leading-tight tracking-[-0.5px]">{ballottaggio ? 'Spareggio!' : 'Chi sta mentendo?'}</h1>
        <p className="m-0 text-sm text-tenue">
          {!inGioco
            ? 'Sei fuori dal gioco: guarda gli altri votare.'
            : ballottaggio
              ? `Pareggio: si vota di nuovo, solo tra ${elenco(p.candidati!.map((id) => nomeDi(v, id)))}.`
              : 'Tocca un giocatore. Il voto resta segreto fino al verdetto.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {votabili.map((id) => {
          const sel = scelto === id;
          const indizi = p.indizi.filter((x) => x.id === id).slice(-3);
          return (
            <button
              key={id}
              type="button"
              disabled={!inGioco}
              aria-pressed={sel}
              onClick={() => setScelto(sel ? null : id)}
              className={`relative flex flex-col gap-2.5 rounded-[20px] border-2 p-3.5 text-left ${sel ? 'border-impostore bg-[#2A1A2E]' : 'border-superficie bg-superficie'}`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar nome={nomeDi(v, id)} colore={coloreDi(v, id)} misura={38} />
                <span className="truncate text-base font-bold">{nomeDi(v, id)}</span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                {indizi.map((x, k) => {
                  const t = testoIndizio(x);
                  return (
                    <span key={k} className={`flex h-[26px] items-center rounded-full bg-superficie-2 px-2.5 text-[13px] font-bold ${t.vero ? 'text-detective' : 'italic text-spento'}`}>
                      {t.testo}
                    </span>
                  );
                })}
              </span>
              {sel && (
                <span aria-hidden="true" className="absolute right-2.5 top-2.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-impostore text-inchiostro">
                  <IconaSpunta size={14} />
                </span>
              )}
              {p.hannoVotato.includes(id) && <span className="text-[11px] font-bold text-spento">ha votato</span>}
            </button>
          );
        })}
        {inGioco && (
          <div className="flex flex-col justify-center gap-1 rounded-[20px] border-2 border-dashed border-bordo p-3.5">
            <span className="text-sm font-bold text-tenue">{nomeDi(v, v.io)} (tu)</span>
            <span className="text-[13px] text-spento">Non puoi votarti</span>
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-tenue">Hanno votato <b className="text-testo">{p.hannoVotato.length} di {p.inGioco.length}</b></span>
        <span aria-hidden="true" className="flex flex-wrap justify-end gap-1.5">
          {p.inGioco.map((id) => (
            <span key={id} className={`h-2 w-[22px] rounded ${p.hannoVotato.includes(id) ? 'bg-impostore' : 'bg-bordo'}`} />
          ))}
        </span>
      </div>

      {inGioco && (
        <Pulsante
          variante={scelto && cambiato ? 'corallo' : 'spento'}
          disabled={!scelto || !cambiato}
          onClick={() => scelto && void invia({ tipo: 'voto', bersaglio: scelto })}
        >
          {!scelto ? 'Scegli qualcuno' : cambiato ? `Vota ${nomeDi(v, scelto)}` : `Hai votato ${nomeDi(v, scelto)}`}
        </Pulsante>
      )}
      {inGioco && p.mioVoto && <p className="m-0 -mt-2 text-center text-[13px] text-spento">Puoi cambiare idea finché non hanno votato tutti.</p>}
      {v.master && p.hannoVotato.length > 0 && p.hannoVotato.length < p.inGioco.length && (
        <Pulsante
          variante="contorno"
          onClick={() => confirm('Chiudere la votazione adesso? Chi non ha votato si considera astenuto.') && void invia({ tipo: 'chiudiVoto' })}
        >
          Chiudi la votazione
        </Pulsante>
      )}
    </Schermo>
  );
}
