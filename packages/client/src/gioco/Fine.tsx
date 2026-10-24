import type { Vista } from '@impostore/engine';
import { Avatar, Pulsante, Schermo } from '../ds/componenti';
import { IconaRipeti } from '../ds/icone';
import { useApp } from '../store';
import { coloreDi, NOME_RUOLO, nomeDi } from '../utilita';

const COLORI = ['#FFD23F', '#FF5470', '#4CC9F0', '#9B8CFF', '#A3E635', '#F472B6'];
const SFONDO_RUOLO = { detective: '#FFD23F', impostore: '#FF5470', mrwhite: '#F4F1FF' } as const;

/** Coriandoli che cadono (decorazione, fermi se il telefono chiede meno animazioni). */
function Coriandoli() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="coriandolo absolute -top-5 rounded-[3px]"
          style={{
            left: `${(i * 37) % 100}%`,
            width: i % 3 === 0 ? 14 : 9,
            height: i % 2 ? 18 : 9,
            background: COLORI[i % COLORI.length],
            animationDuration: `${4 + (i % 5)}s`,
            animationDelay: `${(i * 0.43) % 4}s`,
          }}
        />
      ))}
    </div>
  );
}

export function FaseFine({ v }: { v: Vista }) {
  const invia = useApp((s) => s.invia);
  const p = v.partita!;
  const vit = p.vittoria!;
  const parole = p.parole!;
  const c = p.composizione;

  const [prima, grande, colore] =
    vit.squadra === 'detective'
      ? ['Vincono i', 'DETECTIVE', 'text-detective']
      : vit.squadra === 'mrwhite'
        ? ['Ha indovinato! Vince', 'MR. WHITE', 'text-mrwhite']
        : c.impostori > 0 && c.mrWhite > 0
          ? ['Vincono gli', 'INFILTRATI', 'text-impostore']
          : c.impostori > 0
            ? [c.impostori > 1 ? 'Vincono gli' : 'Vince', c.impostori > 1 ? 'IMPOSTORI' : 'L\'IMPOSTORE', 'text-impostore']
            : ['Vince', 'MR. WHITE', 'text-mrwhite'];
  const hoVinto = vit.vincitori.includes(v.io);
  const classifica = [...v.giocatori].filter((g) => g.inPartita).sort((a, b) => b.punti - a.punti);

  return (
    <>
      <Coriandoli />
      <Schermo className="z-10 gap-[18px]">
        <div className="relative flex flex-col items-center gap-1.5 pt-6 text-center">
          <span className="text-[13px] font-bold tracking-[2px] text-tenue">FINE PARTITA {p.numero}</span>
          <span className="font-titolo text-xl font-bold">{prima}</span>
          <h1 className={`m-0 font-titolo text-[40px] font-extrabold leading-none tracking-[-2px] ${colore}`}>{grande}</h1>
          {p.mia && <span className="mt-1 text-sm font-bold text-tenue">{hoVinto ? 'Hai vinto!' : 'Hai perso, sarà per la prossima.'}</span>}
        </div>

        <div className="relative grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1 rounded-[20px] bg-detective p-3.5 text-inchiostro">
            <span className="text-xs font-bold tracking-[1px]">PAROLA DETECTIVE</span>
            <span className="break-words font-titolo text-[19px] font-extrabold uppercase">{parole.detective}</span>
          </div>
          {c.impostori > 0 ? (
            <div className="flex flex-col gap-1 rounded-[20px] bg-impostore p-3.5 text-inchiostro">
              <span className="text-xs font-bold tracking-[1px]">PAROLA IMPOSTORE</span>
              <span className="break-words font-titolo text-[19px] font-extrabold uppercase">{parole.impostore}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1 rounded-[20px] bg-mrwhite p-3.5 text-inchiostro">
              <span className="text-xs font-bold tracking-[1px]">MR. WHITE</span>
              <span className="font-titolo text-[19px] font-extrabold">nessuna</span>
            </div>
          )}
        </div>

        <ol className="relative m-0 flex list-none flex-col rounded-[22px] bg-superficie px-3.5 py-1.5">
          {classifica.map((g, i) => {
            const vinti = vit.punti[g.id] ?? 0;
            return (
              <li key={g.id} className={`flex h-[50px] items-center gap-2.5 ${i < classifica.length - 1 ? 'border-b border-superficie-2' : ''}`}>
                <span className="w-4 font-titolo text-xs font-bold text-spento">{i + 1}</span>
                <Avatar nome={g.nome} colore={coloreDi(v, g.id)} misura={32} />
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{g.id === v.io ? `${g.nome} (tu)` : g.nome}</span>
                {g.ruolo && (
                  <span className="flex h-6 items-center rounded-full px-2.5 text-xs font-bold text-inchiostro" style={{ background: SFONDO_RUOLO[g.ruolo] }}>
                    {NOME_RUOLO[g.ruolo]}
                  </span>
                )}
                <span className="flex w-14 flex-col items-end leading-tight">
                  <span className={`font-titolo text-sm font-bold ${vinti ? 'text-detective' : 'text-spento'}`}>{vinti ? `+${vinti}` : '0'}</span>
                  <span className="text-[11px] text-spento">tot {g.punti}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex-1" />

        {v.master ? (
          <div className="relative grid grid-cols-2 gap-2.5">
            <Pulsante variante="contornoTesto" onClick={() => void invia({ tipo: 'tornaAllaLobby' })}>
              Cambia modalità
            </Pulsante>
            <Pulsante onClick={() => void invia({ tipo: 'avviaPartita' })}>
              <IconaRipeti size={18} /> Rivincita
            </Pulsante>
          </div>
        ) : (
          <p className="pulsa relative m-0 text-center text-tenue">Aspetta che {nomeDi(v, v.idMaster)} lanci la rivincita…</p>
        )}
      </Schermo>
    </>
  );
}
