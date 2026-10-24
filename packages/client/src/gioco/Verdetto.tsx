import type { Vista } from '@impostore/engine';
import { Avatar, Pulsante, Schermo } from '../ds/componenti';
import { IconaAvanti, IconaFantasma } from '../ds/icone';
import { useApp } from '../store';
import { coloreDi, elenco, nomeDi, plurale, ruoloRivelato } from '../utilita';
import { BarraPartita } from './SchermoGioco';

const SFONDO_RUOLO = { detective: 'bg-detective', impostore: 'bg-impostore', mrwhite: 'bg-mrwhite' } as const;

/** Quanti infiltrati restano in gioco: si deduce da composizione e ruoli già rivelati (informazione pubblica). */
export function infiltratiRimasti(v: Vista): number {
  const p = v.partita!;
  const usciti = v.giocatori.filter((g) => g.inPartita && !g.inGioco && g.ruolo && g.ruolo !== 'detective').length;
  return p.composizione.impostori + p.composizione.mrWhite - usciti;
}

export function FaseVerdetto({ v }: { v: Vista }) {
  const invia = useApp((s) => s.invia);
  const p = v.partita!;
  const d = p.verdetto!;
  const massimo = d.conteggio[0]?.voti ?? 1;
  const eliminato = d.eliminato;
  const rimasti = infiltratiRimasti(v);

  return (
    <Schermo>
      <BarraPartita v={v} titolo={`Verdetto · Giro ${d.giro}`} />
      <h1 className="m-0 font-titolo text-[28px] font-extrabold tracking-[-0.5px]">{d.esito === 'pareggio' ? 'Pareggio!' : 'Il gruppo ha scelto'}</h1>

      <div className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4">
        {d.conteggio.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            <Avatar nome={nomeDi(v, c.id)} colore={coloreDi(v, c.id)} misura={30} />
            <span className="w-20 truncate text-sm font-bold">{nomeDi(v, c.id)}</span>
            <span className="h-3 flex-1 overflow-hidden rounded-md bg-superficie-2">
              <span
                className="block h-full rounded-md transition-[width] duration-700"
                style={{ width: `${Math.round((c.voti / massimo) * 100)}%`, background: c.voti === massimo ? '#FF5470' : '#8F88AE' }}
              />
            </span>
            <span className="w-5 text-right font-titolo text-sm font-bold">{c.voti}</span>
          </div>
        ))}
      </div>

      {eliminato && d.ruolo ? (
        <div className={`gira flex flex-col items-center gap-3.5 rounded-[30px] px-6 py-[26px] text-center text-inchiostro shadow-[0_24px_50px_rgba(0,0,0,.5)] ${SFONDO_RUOLO[d.ruolo]}`}>
          <span className="rounded-full border-4 border-inchiostro">
            <Avatar nome={nomeDi(v, eliminato)} colore={coloreDi(v, eliminato)} misura={80} />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-base font-bold">{eliminato === v.io ? 'Eri' : `${nomeDi(v, eliminato)} era`}</span>
            <span className="font-titolo text-[30px] font-extrabold leading-none tracking-[-1px]">{ruoloRivelato(d.ruolo, p.composizione.impostori)}</span>
          </div>
          {d.tentativo && (
            <span className="rounded-2xl bg-inchiostro/12 px-4 py-2 text-sm font-bold">
              {eliminato === v.io
                ? d.tentativo.testo ? `Hai provato «${d.tentativo.testo.toUpperCase()}»: ` : 'Non hai risposto: '
                : d.tentativo.testo ? `Ha provato «${d.tentativo.testo.toUpperCase()}»: ` : 'Non ha risposto: '}
              {d.tentativo.esatto ? 'HA INDOVINATO!' : 'sbagliato.'}
            </span>
          )}
        </div>
      ) : (
        <div className="gira flex flex-col items-center gap-2 rounded-[30px] bg-superficie-2 px-6 py-[26px] text-center">
          <span className="font-titolo text-lg font-bold">Pari tra {elenco(d.pari.map((id) => nomeDi(v, id)))}</span>
          <span className="text-tenue">{p.candidati ? 'Si va al ballottaggio: si vota solo tra loro.' : 'Pareggio anche al ballottaggio: nessuno esce, nuovo giro di indizi.'}</span>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-[18px] bg-superficie px-4 py-3.5">
        <IconaFantasma size={22} className="mt-px shrink-0" />
        <span className="text-sm leading-relaxed text-chiaro">
          {p.finita ? (
            <b className="text-testo">La partita è finita!</b>
          ) : (
            <>La partita continua: restano {plurale(p.inGioco.length, 'giocatore', 'giocatori')}, tra cui <b className="text-testo">{plurale(rimasti, 'infiltrato', 'infiltrati')}</b>.</>
          )}
        </span>
      </div>

      <details className="rounded-2xl bg-superficie px-4 py-3">
        <summary className="cursor-pointer text-sm font-bold text-tenue">Chi ha votato chi</summary>
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-sm">
          {Object.entries(d.voti).map(([chi, per]) => (
            <li key={chi} className="flex justify-between gap-2">
              <span>{nomeDi(v, chi)}</span>
              <span className="font-bold text-impostore">→ {nomeDi(v, per)}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="flex-1" />

      {v.master ? (
        <Pulsante onClick={() => void invia({ tipo: 'prosegui' })}>
          {p.finita ? 'Vedi i risultati' : p.candidati ? 'Vai al ballottaggio' : 'Prossimo giro'} <IconaAvanti />
        </Pulsante>
      ) : (
        <p className="pulsa m-0 text-center text-tenue">Aspetta che {nomeDi(v, v.idMaster)} vada avanti…</p>
      )}
    </Schermo>
  );
}
