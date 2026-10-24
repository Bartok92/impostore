import { useEffect, useState } from 'react';
import { MAX_INDIZIO, type Indizio, type Vista } from '@impostore/engine';
import { Anello, Attesa, Avatar, Pulsante, Schermo } from '../ds/componenti';
import { IconaAvanti, IconaMicrofono, IconaSalta } from '../ds/icone';
import { useRimanente } from '../hooks';
import { useApp } from '../store';
import { coloreDi, nomeDi, vibra } from '../utilita';
import { BarraPartita } from './SchermoGioco';

/** Come si mostra un indizio: il testo, oppure cosa è successo. */
export function testoIndizio(i: Indizio): { testo: string; vero: boolean } {
  if (i.testo) return { testo: i.testo, vero: true };
  return { testo: i.esito === 'aVoce' ? 'a voce' : i.esito === 'tempo' ? 'tempo scaduto' : 'saltato', vero: false };
}

export function FaseIndizi({ v }: { v: Vista }) {
  const invia = useApp((s) => s.invia);
  const ricevutoA = useApp((s) => s.ricevutoA);
  const p = v.partita!;
  const parla = p.parla;
  const tocca = parla === v.io;
  const rimanente = useRimanente(p.rimanenteMs, ricevutoA);
  const totaleMs = p.impostazioni.secondiIndizio * 1000;
  const [testo, setTesto] = useState('');
  const [invio, setInvio] = useState(false);
  const passaggi = p.impostazioni.doppioGiro ? 2 : 1;

  // Quando tocca a me il telefono vibra; il campo si svuota a ogni nuovo turno.
  useEffect(() => {
    setTesto('');
    if (tocca) vibra([120, 80, 120]);
  }, [tocca, p.turno, p.passaggio]);

  const manda = async (t: string | null) => {
    setInvio(true);
    await invia({ tipo: 'indizio', testo: t });
    setInvio(false);
  };

  const delGiro = p.indizi.filter((i) => i.giro === p.giro);
  const precedenti = p.indizi.filter((i) => i.giro < p.giro);

  return (
    <Schermo>
      <BarraPartita v={v} titolo={`Giro ${p.giro}${passaggi > 1 ? ` · ${p.passaggio}° di 2` : ''} · Indizi`} />

      {tocca ? (
        <div className="compari flex items-center justify-between rounded-[28px] bg-detective px-[22px] py-5 text-inchiostro">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-bold tracking-[1px]">TOCCA A</span>
            <span className="font-titolo text-[34px] font-extrabold leading-none tracking-[-1px]">TE</span>
            <span className="text-sm font-medium">Una parola sola</span>
          </div>
          {rimanente !== null && <Anello rimanenteMs={rimanente} totaleMs={totaleMs} />}
        </div>
      ) : (
        <div className="compari flex items-center justify-between gap-3 rounded-[28px] bg-superficie px-[22px] py-5">
          <div className="flex min-w-0 items-center gap-3.5">
            {parla && <Avatar nome={nomeDi(v, parla)} colore={coloreDi(v, parla)} misura={52} />}
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[13px] font-bold tracking-[1px] text-tenue">TOCCA A</span>
              <span className="truncate font-titolo text-[26px] font-extrabold leading-none">{nomeDi(v, parla)}</span>
            </div>
          </div>
          {rimanente !== null && <Anello rimanenteMs={rimanente} totaleMs={totaleMs} colore="#FFD23F" traccia="rgba(255,210,63,.15)" />}
        </div>
      )}

      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {p.parlanti.map((id, i) => {
          const suoi = delGiro.filter((x) => x.id === id);
          const ora = id === parla;
          return (
            <li
              key={id}
              className={`flex min-h-[52px] items-center gap-3 rounded-2xl border-[1.5px] px-3.5 py-2 ${ora ? 'border-detective bg-superficie-2' : 'border-superficie bg-superficie'}`}
            >
              <span className="w-3.5 font-titolo text-xs font-bold text-spento">{i + 1}</span>
              <Avatar nome={nomeDi(v, id)} colore={coloreDi(v, id)} misura={32} />
              <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{id === v.io ? `${nomeDi(v, id)} (tu)` : nomeDi(v, id)}</span>
              <span className="flex flex-wrap justify-end gap-x-2 text-right text-[15px] font-bold">
                {suoi.map((x, k) => {
                  const t = testoIndizio(x);
                  return <span key={k} className={t.vero ? 'text-detective' : 'text-sm italic text-spento'}>{t.testo}</span>;
                })}
                {ora && <Attesa testo={id === v.io ? 'tocca a te' : 'sta pensando…'} />}
                {!ora && suoi.length === 0 && <span className="text-spento">—</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {precedenti.length > 0 && (
        <details className="rounded-2xl bg-superficie px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold text-tenue">Indizi dei giri precedenti</summary>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-sm">
            {precedenti.map((x, k) => {
              const t = testoIndizio(x);
              return (
                <li key={k} className="flex justify-between gap-2">
                  <span className="text-tenue">Giro {x.giro} · {nomeDi(v, x.id)}</span>
                  <span className={t.vero ? 'font-bold text-detective' : 'italic text-spento'}>{t.testo}</span>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <div className="flex-1" />

      {tocca ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (testo.trim()) void manda(testo.trim());
          }}
        >
          <label htmlFor="indizio" className="text-[13px] font-bold text-tenue">Il tuo indizio</label>
          <div className="flex gap-2.5">
            <input
              id="indizio"
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              maxLength={MAX_INDIZIO}
              autoComplete="off"
              autoFocus
              enterKeyHint="send"
              className="h-[58px] min-w-0 flex-1 rounded-[18px] border-2 border-detective bg-superficie px-[18px] text-lg font-bold text-testo outline-none"
            />
            <button type="submit" aria-label="Invia indizio" disabled={!testo.trim() || invio} className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-detective text-inchiostro disabled:opacity-45">
              <IconaAvanti size={22} />
            </button>
          </div>
          <button type="button" disabled={invio} onClick={() => void manda(null)} className="flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-tenue">
            <IconaMicrofono size={18} /> L'ho detto a voce
          </button>
        </form>
      ) : p.mia && !p.mia.inGioco ? (
        <p className="m-0 text-center text-tenue">Sei fuori dal gioco: ascolta e goditi lo spettacolo.</p>
      ) : v.master && parla ? (
        <Pulsante variante="contorno" onClick={() => confirm(`Saltare il turno di ${nomeDi(v, parla)}?`) && void invia({ tipo: 'saltaTurno' })}>
          <IconaSalta /> Salta il turno di {nomeDi(v, parla)}
        </Pulsante>
      ) : (
        <p className="m-0 text-center text-tenue">Ascolta bene gli indizi degli altri.</p>
      )}
    </Schermo>
  );
}
