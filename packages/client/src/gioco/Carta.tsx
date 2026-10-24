import { useState } from 'react';
import { nomeCategoria, type Composizione, type IdCategoria, type MiaCarta, type Vista } from '@impostore/engine';
import { Avatar, Pulsante, Schermo } from '../ds/componenti';
import { IconaFantasma, IconaLampadina, IconaLucchetto, IconaOcchio, IconaOcchioBarrato, IconaSpunta } from '../ds/icone';
import { useApp } from '../store';
import { coloreDi, elenco, plurale } from '../utilita';

const STILE: Record<MiaCarta['ruolo'], { sfondo: string; etichetta: string; piede: string }> = {
  detective: { sfondo: 'bg-detective', etichetta: 'DETECTIVE', piede: 'Non mostrarla a nessuno' },
  impostore: { sfondo: 'bg-impostore', etichetta: 'IMPOSTORE', piede: 'Sei l\'impostore: confonditi' },
  mrwhite: { sfondo: 'bg-mrwhite', etichetta: 'MR. WHITE', piede: 'Nessuno sa chi sei. Mimetizzati.' },
};

/** La carta segreta. Con l'impostore inconsapevole arriva già "travestita" da detective. */
export function CartaRuolo({ carta, categoria, compatta }: { carta: MiaCarta; categoria: IdCategoria; compatta?: boolean }) {
  const s = STILE[carta.ruolo];
  const parola = carta.parola ?? '';
  const misura = parola.length > 14 ? 'text-[26px]' : parola.length > 9 ? 'text-[32px]' : 'text-[44px]';
  return (
    <div className={`relative ${compatta ? 'h-[300px]' : 'h-[400px]'}`}>
      <div aria-hidden="true" className={`absolute inset-x-2.5 bottom-0 top-3.5 rounded-[30px] bg-superficie-2 ${carta.ruolo === 'mrwhite' ? '-rotate-[4deg]' : 'rotate-[4deg]'}`} />
      <div className={`gira absolute inset-0 flex flex-col justify-between rounded-[30px] p-[26px] text-inchiostro shadow-[0_24px_50px_rgba(0,0,0,.5)] ${s.sfondo}`}>
        <div className="flex items-center justify-between">
          <span className="font-titolo text-xs font-bold tracking-[2px]">{s.etichetta}</span>
          {carta.ruolo === 'mrwhite' ? (
            <IconaFantasma size={40} />
          ) : (
            <span className="flex h-7 items-center rounded-full bg-inchiostro/12 px-3 text-[13px] font-bold">{nomeCategoria(categoria)}</span>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-bold tracking-[1px]">LA TUA PAROLA</span>
          {carta.ruolo === 'mrwhite' ? (
            <>
              <div className="flex h-[76px] items-center justify-center rounded-[18px] border-[2.5px] border-dashed border-spento font-titolo text-lg font-bold text-[#5E577D]">nessuna parola</div>
              <span className="font-titolo text-[26px] font-extrabold leading-tight tracking-[-0.5px]">Improvvisa.</span>
            </>
          ) : (
            <span className={`break-words font-titolo font-extrabold uppercase leading-none tracking-[-1px] ${misura}`}>{parola}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <IconaLucchetto size={18} />
          {s.piede}
        </div>
      </div>
    </div>
  );
}

function infiltrati(c: Composizione): string {
  const pezzi = [c.impostori > 0 && plurale(c.impostori, 'impostore', 'impostori'), c.mrWhite > 0 && 'Mr. White'].filter(Boolean) as string[];
  return elenco(pezzi);
}

/** Suggerimenti sotto la carta, diversi per ogni ruolo. */
export function Suggerimenti({ carta, comp }: { carta: MiaCarta; comp: Composizione }) {
  const righe =
    carta.ruolo === 'detective'
      ? [`Tra voi ${comp.impostori + comp.mrWhite === 1 ? 'c\'è' : 'ci sono'} ${infiltrati(comp)}. Dai un indizio legato alla parola, ma non troppo facile: ${comp.impostori + comp.mrWhite === 1 ? 'potrebbe' : 'potrebbero'} indovinarla.`]
      : carta.ruolo === 'impostore'
        ? ['La tua parola è simile a quella dei detective, ma non uguale. Ascolta i loro indizi e confonditi.']
        : ['Ascolta gli indizi di chi parla prima di te e inventa il tuo.', 'Se ti scoprono hai un\'ultima chance: indovina la parola e vinci tu.'];
  return (
    <div className="flex flex-col gap-2.5">
      {righe.map((r, i) => (
        <div key={i} className="flex items-start gap-3 rounded-[18px] bg-superficie px-4 py-3.5">
          {righe.length > 1 ? (
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-mrwhite font-titolo text-sm font-extrabold text-inchiostro">{i + 1}</span>
          ) : (
            <IconaLampadina size={22} className="mt-px shrink-0 text-detective" />
          )}
          <span className="text-sm leading-relaxed text-chiaro">{r}</span>
        </div>
      ))}
    </div>
  );
}

export function FaseCarta({ v }: { v: Vista }) {
  const invia = useApp((s) => s.invia);
  const [scoperta, setScoperta] = useState(false);
  const p = v.partita!;
  const mia = p.mia;
  const visto = p.visto.includes(v.io);
  const pronti = p.visto.length;
  const totale = p.ordine.length;
  const io = v.giocatori.find((g) => g.id === v.io)!;

  const intestazione = (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-[1.5px] text-tenue">Partita {p.numero} · Giro 1</span>
      <span className="flex items-center gap-2 text-[13px] text-tenue">
        <Avatar nome={io.nome} colore={coloreDi(v, io.id)} misura={30} />
        {io.nome}
      </span>
    </div>
  );

  if (!mia) {
    return <Schermo className="justify-center text-center"><p className="text-tenue">Questa partita è iniziata senza di te: aspetta la prossima.</p></Schermo>;
  }

  if (visto && !scoperta) {
    return (
      <Schermo>
        {intestazione}
        <h1 className="m-0 font-titolo text-[28px] font-extrabold tracking-[-0.5px]">Si parte?</h1>
        <p className="m-0 text-tenue">Hai visto la tua carta. Quando l'hanno vista tutti si parte con gli indizi.</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {p.ordine.map((id) => {
            const g = v.giocatori.find((x) => x.id === id)!;
            const ok = p.visto.includes(id);
            return (
              <li key={id} className="flex h-[52px] items-center gap-3 rounded-2xl bg-superficie px-3.5">
                <Avatar nome={g.nome} colore={coloreDi(v, id)} misura={32} />
                <span className="flex-1 font-bold">{g.nome}</span>
                {ok ? <span className="flex items-center gap-1 text-sm font-bold text-verde"><IconaSpunta size={16} /> carta vista</span> : <span className="pulsa text-sm text-spento">sta guardando…</span>}
              </li>
            );
          })}
        </ul>
        <div className="flex-1" />
        <div className="flex flex-col gap-2.5">
          <Pulsante variante="contorno" onClick={() => setScoperta(true)}>
            <IconaOcchio /> Rivedi la mia carta
          </Pulsante>
          {v.master && pronti < totale && (
            <Pulsante variante="contorno" onClick={() => confirm('Iniziare gli indizi anche se qualcuno non ha ancora confermato la carta?') && void invia({ tipo: 'iniziaIndizi' })}>
              Inizia comunque gli indizi
            </Pulsante>
          )}
          <p className="m-0 text-center text-[13px] text-spento">{pronti} di {totale} hanno visto la propria carta</p>
        </div>
      </Schermo>
    );
  }

  return (
    <Schermo>
      {intestazione}
      <h1 className="m-0 font-titolo text-[28px] font-extrabold tracking-[-0.5px]">Il tuo ruolo</h1>
      {scoperta ? (
        <>
          <CartaRuolo carta={mia} categoria={p.categoria} />
          <Suggerimenti carta={mia} comp={p.composizione} />
        </>
      ) : (
        <button
          type="button"
          onClick={() => setScoperta(true)}
          className="relative flex h-[400px] flex-col items-center justify-center gap-4 rounded-[30px] border-2 border-dashed border-bordo-acceso bg-superficie text-center"
        >
          <span className="font-titolo text-[96px] font-extrabold leading-none text-impostore">?</span>
          <span className="font-titolo text-lg font-bold">Tocca per scoprire la tua carta</span>
          <span className="px-8 text-sm text-tenue">Assicurati che nessuno stia guardando il tuo schermo.</span>
        </button>
      )}
      <div className="flex-1" />
      {scoperta && (
        <div className="flex flex-col gap-2.5">
          <Pulsante
            variante={mia.ruolo === 'mrwhite' ? 'bianco' : mia.ruolo === 'impostore' ? 'corallo' : 'giallo'}
            onClick={() => {
              setScoperta(false);
              if (!visto) void invia({ tipo: 'confermaVisto' });
            }}
          >
            <IconaOcchioBarrato /> Nascondi, ho capito
          </Pulsante>
          <p className="m-0 text-center text-[13px] text-spento">{pronti} di {totale} hanno già visto il proprio ruolo</p>
        </div>
      )}
    </Schermo>
  );
}
