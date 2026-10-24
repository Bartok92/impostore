import { useEffect, useState } from 'react';
import { MAX_TENTATIVO, type Vista } from '@impostore/engine';
import { Anello, Avatar, Pulsante, Schermo } from '../ds/componenti';
import { IconaFantasma, IconaSalta } from '../ds/icone';
import { useRimanente } from '../hooks';
import { useApp } from '../store';
import { coloreDi, nomeDi, vibra } from '../utilita';
import { BarraPartita } from './SchermoGioco';

/** Mr. White è stato scoperto: ultima chance per indovinare la parola dei detective. */
export function FaseMrWhite({ v }: { v: Vista }) {
  const invia = useApp((s) => s.invia);
  const ricevutoA = useApp((s) => s.ricevutoA);
  const p = v.partita!;
  const mw = p.verdetto!.eliminato!;
  const sonoIo = mw === v.io;
  const rimanente = useRimanente(p.rimanenteMs, ricevutoA);
  const [testo, setTesto] = useState('');
  const [invio, setInvio] = useState(false);
  const [conferma, setConferma] = useState(false);
  // Gli indizi veri (scritti), senza ripetizioni: aiutano Mr. White a indovinare.
  const indizi = [...new Set(p.indizi.filter((i) => i.testo && i.id !== mw).map((i) => i.testo!.toLowerCase()))];

  useEffect(() => {
    if (sonoIo) vibra([200, 100, 200]);
  }, [sonoIo]);

  return (
    <Schermo>
      <BarraPartita v={v} titolo={`Verdetto · Giro ${p.giro}`} />
      <div className="gira flex flex-col gap-4 rounded-[30px] bg-mrwhite p-6 text-inchiostro">
        <div className="flex items-start justify-between">
          {sonoIo ? <IconaFantasma size={48} /> : <Avatar nome={nomeDi(v, mw)} colore={coloreDi(v, mw)} misura={48} />}
          {rimanente !== null && <Anello rimanenteMs={rimanente} totaleMs={p.impostazioni.secondiIndizio * 1000} misura={64} colore="#FF5470" traccia="rgba(17,14,31,.12)" />}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-bold">{sonoIo ? 'Ti hanno scoperto, Mr. White.' : `${nomeDi(v, mw)} era MR. WHITE!`}</span>
          <span className="font-titolo text-[32px] font-extrabold leading-[1.05] tracking-[-1px]">Ultima chance</span>
          <span className="text-[15px] leading-snug text-[#3D3760]">
            {sonoIo
              ? 'Indovina la parola dei detective e vinci la partita. Hai un solo tentativo.'
              : 'Sta provando a indovinare la parola dei detective: se ci riesce vince da solo.'}
          </span>
        </div>
      </div>

      {indizi.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="m-0 text-xs font-bold uppercase tracking-[1.5px] text-tenue">{sonoIo ? 'Indizi che hai sentito' : 'Indizi detti finora'}</h2>
          <div className="flex flex-wrap gap-2">
            {indizi.map((i) => (
              <span key={i} className="flex h-[34px] items-center rounded-full bg-superficie px-3.5 text-sm font-bold text-detective">{i}</span>
            ))}
          </div>
        </section>
      )}

      <div className="flex-1" />

      {sonoIo ? (
        <form
          className="flex flex-col gap-2.5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!testo.trim()) return;
            // Un solo tentativo: prima si chiede conferma, dentro l'app.
            if (!conferma) return setConferma(true);
            setInvio(true);
            await invia({ tipo: 'indovina', testo: testo.trim() });
            setInvio(false);
          }}
        >
          <label htmlFor="tentativo" className="text-[13px] font-bold text-tenue">La parola è…</label>
          <input
            id="tentativo"
            value={testo}
            onChange={(e) => {
              setTesto(e.target.value);
              setConferma(false);
            }}
            maxLength={MAX_TENTATIVO}
            autoComplete="off"
            autoFocus
            className="h-16 rounded-[20px] border-2 border-mrwhite bg-superficie px-5 font-titolo text-[22px] font-bold uppercase text-testo outline-none"
          />
          {conferma && <p className="m-0 text-center text-sm font-bold text-detective">Sicuro? Hai un solo tentativo.</p>}
          <Pulsante type="submit" variante={conferma ? 'giallo' : 'bianco'} disabled={!testo.trim() || invio}>
            {conferma ? `Sì, è «${testo.trim().toUpperCase()}»` : 'Indovina'}
          </Pulsante>
        </form>
      ) : (
        <>
          <p className="pulsa m-0 text-center text-tenue">{nomeDi(v, mw)} sta provando a indovinare…</p>
          {v.master && (
            <Pulsante variante="contorno" onClick={() => confirm(`${nomeDi(v, mw)} non risponde? Il tentativo conterà come sbagliato.`) && void invia({ tipo: 'saltaTurno' })}>
              <IconaSalta /> Non risponde: vai avanti
            </Pulsante>
          )}
        </>
      )}
    </Schermo>
  );
}
