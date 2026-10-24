import { useState, type ReactNode } from 'react';
import {
  CATEGORIE, composizione, maxInfiltrati, problemiComposizione, SECONDI_POSSIBILI,
  type Impostazioni, type SceltaCategoria, type Vista,
} from '@impostore/engine';
import { Foglio, Interruttore, Pulsante, PulsanteIcona, Schermo } from '../ds/componenti';
import { IconaFantasma, IconaFiamma, IconaIndietro, IconaOrologio, IconaPlay, IconaRipeti, IconaScambia } from '../ds/icone';
import { useApp } from '../store';
import { plurale } from '../utilita';

const SCELTE: { id: SceltaCategoria; nome: string; adulti?: boolean; esplicita?: boolean }[] = [
  { id: 'casuale', nome: 'Casuale' },
  ...CATEGORIE.map((c) => ({ id: c.id, nome: c.nome, adulti: c.adulti, esplicita: c.esplicita })),
];

/** Bollino "18+" delle categorie per adulti. */
export function Bollino18({ invertito }: { invertito?: boolean }) {
  return (
    <span aria-hidden="true" className={`rounded-md px-1.5 py-px text-[10px] font-extrabold leading-tight ${invertito ? 'bg-inchiostro text-impostore' : 'bg-impostore text-inchiostro'}`}>
      18+
    </span>
  );
}

export function Modalita({ v, indietro }: { v: Vista; indietro: () => void }) {
  const invia = useApp((s) => s.invia);
  const imp = v.impostazioni;
  const n = v.giocatori.length;
  const cambia = (x: Partial<Impostazioni>) => void invia({ tipo: 'impostaImpostazioni', impostazioni: x });
  const comp = composizione(n, imp);
  const problemi = problemiComposizione(n, imp);
  const minImpostori = imp.mrWhite ? 0 : 1;
  const maxImpostori = Math.max(minImpostori, maxInfiltrati(n) - (imp.mrWhite ? 1 : 0));
  const [chiediConferma, setChiediConferma] = useState(false);

  return (
    <Schermo className="gap-[22px]">
      <div className="flex items-center gap-3.5">
        <PulsanteIcona etichetta="Indietro" onClick={indietro}>
          <IconaIndietro />
        </PulsanteIcona>
        <h1 className="m-0 font-titolo text-xl font-bold">Prepara la partita</h1>
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="m-0 text-xs font-bold uppercase tracking-[1.5px] text-tenue">Categoria delle parole</h2>
        <div className="flex flex-wrap gap-2">
          {SCELTE.map((c) => {
            const scelta = imp.categoria === c.id;
            const colori = c.adulti
              ? scelta ? 'border-impostore bg-impostore text-inchiostro' : 'border-impostore/60 text-impostore'
              : scelta ? 'border-detective bg-detective text-inchiostro' : 'border-bordo text-testo';
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={scelta}
                aria-label={c.adulti ? `${c.nome}, solo per adulti` : undefined}
                // Le parole volgari si attivano solo dopo la conferma del Master.
                onClick={() => (c.esplicita && !scelta ? setChiediConferma(true) : cambia({ categoria: c.id }))}
                className={`flex h-10 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-sm font-bold ${colori}`}
              >
                {c.adulti && <IconaFiamma size={16} />}
                {c.nome}
                {c.adulti && <Bollino18 invertito={scelta} />}
              </button>
            );
          })}
        </div>
        {imp.categoria === 'piccante' && (
          <p className="m-0 rounded-2xl border-[1.5px] border-impostore/60 px-4 py-3 text-[13px] leading-snug text-chiaro">
            <b className="text-impostore">Solo per adulti.</b> Parole maliziose per le serate più piccanti: scegliete questa categoria solo se tutti al tavolo sono d'accordo. Con "Casuale" non esce mai.
          </p>
        )}
        {imp.categoria === 'senzacensura' && (
          <p className="m-0 rounded-2xl border-[1.5px] border-impostore px-4 py-3 text-[13px] leading-snug text-chiaro">
            <b className="text-impostore">Senza censura, solo maggiorenni.</b> Parole volgari ed esplicite. Con "Casuale" non esce mai.
          </p>
        )}
      </section>

      <Foglio aperto={chiediConferma} onChiudi={() => setChiediConferma(false)} titolo="Senza censura · 18+">
        <p className="mb-5 mt-0 leading-relaxed text-chiaro">
          Questa categoria contiene <b className="text-testo">parole volgari ed esplicite</b>. Attivala solo se al tavolo siete <b className="text-testo">tutti maggiorenni</b> e d'accordo.
        </p>
        <div className="flex flex-col gap-2.5">
          <Pulsante
            variante="corallo"
            onClick={() => {
              setChiediConferma(false);
              cambia({ categoria: 'senzacensura' });
            }}
          >
            Siamo tutti maggiorenni: attiva
          </Pulsante>
          <Pulsante variante="contornoTesto" onClick={() => setChiediConferma(false)}>Annulla</Pulsante>
        </div>
      </Foglio>

      <section className="flex items-center justify-between rounded-[20px] bg-superficie px-4 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold">Impostori</span>
          <span className="text-[13px] text-tenue">Ricevono una parola simile</span>
        </div>
        <div className="flex items-center gap-3">
          <PulsanteIcona etichetta="Un impostore in meno" disabled={imp.impostori <= minImpostori} onClick={() => cambia({ impostori: imp.impostori - 1 })} className="text-2xl disabled:opacity-30">−</PulsanteIcona>
          <span className="min-w-5 text-center font-titolo text-2xl font-extrabold text-impostore" aria-live="polite">{imp.impostori}</span>
          <PulsanteIcona etichetta="Un impostore in più" disabled={imp.impostori >= maxImpostori} onClick={() => cambia({ impostori: imp.impostori + 1 })} className="text-2xl disabled:opacity-30">+</PulsanteIcona>
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="m-0 text-xs font-bold uppercase tracking-[1.5px] text-tenue">Modalità speciali</h2>
        <SchedaModalita
          titolo="Mr. White" colore="#F4F1FF" icona={<IconaFantasma size={24} />} acceso={imp.mrWhite}
          onCambia={(x) => cambia({ mrWhite: x, impostori: !x && imp.impostori === 0 ? 1 : imp.impostori })}
        >
          Non riceve nessuna parola e improvvisa. Se viene scoperto può ancora vincere indovinando la parola.
        </SchedaModalita>
        <SchedaModalita titolo="Impostore inconsapevole" colore="#FF5470" icona={<IconaScambia size={24} />} acceso={imp.inconsapevole} onCambia={(x) => cambia({ inconsapevole: x })}>
          L'impostore riceve una parola vicina (mare / lago) e non sa di essere l'impostore.
        </SchedaModalita>
        <SchedaModalita
          titolo="Indizi a tempo" colore="#4CC9F0" icona={<IconaOrologio size={24} />} acceso={imp.indiziATempo} onCambia={(x) => cambia({ indiziATempo: x })}
          extra={imp.indiziATempo && (
            <div className="flex gap-1.5 pl-[58px]">
              {SECONDI_POSSIBILI.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={imp.secondiIndizio === s}
                  onClick={() => cambia({ secondiIndizio: s })}
                  className={`h-9 whitespace-nowrap rounded-full px-3 text-[13px] font-bold ${imp.secondiIndizio === s ? 'bg-ciano text-inchiostro' : 'bg-superficie-2 text-testo'}`}
                >
                  {s} s
                </button>
              ))}
            </div>
          )}
        >
          {imp.secondiIndizio} secondi a testa per dare il proprio indizio.
        </SchedaModalita>
        <SchedaModalita titolo="Doppio giro" colore="#9B8CFF" icona={<IconaRipeti size={24} />} acceso={imp.doppioGiro} onCambia={(x) => cambia({ doppioGiro: x })}>
          Due giri di indizi prima di ogni votazione.
        </SchedaModalita>
      </section>

      <div className="flex-1" />

      <div className="flex flex-col gap-2.5 rounded-[18px] bg-superficie px-4 py-3.5">
        <span className="text-[13px] text-tenue">{plurale(n, 'giocatore', 'giocatori')} in questa partita</span>
        {problemi.length ? (
          <p className="m-0 text-sm font-bold text-impostore">{problemi[0]}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Pillola colore="#FFD23F">{comp.detective} detective</Pillola>
            {comp.impostori > 0 && <Pillola colore="#FF5470">{plurale(comp.impostori, 'impostore', 'impostori')}</Pillola>}
            {comp.mrWhite > 0 && <Pillola colore="#F4F1FF">1 Mr. White</Pillola>}
          </div>
        )}
      </div>

      <Pulsante disabled={problemi.length > 0} onClick={() => void invia({ tipo: 'avviaPartita' })}>
        <IconaPlay /> Inizia la partita
      </Pulsante>
    </Schermo>
  );
}

function Pillola({ colore, children }: { colore: string; children: ReactNode }) {
  return (
    <span className="flex h-[30px] items-center gap-1.5 rounded-full bg-superficie-2 px-3 text-sm font-bold">
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: colore }} />
      {children}
    </span>
  );
}

function SchedaModalita({ titolo, colore, icona, acceso, onCambia, children, extra }: {
  titolo: string; colore: string; icona: ReactNode; acceso: boolean; onCambia: (v: boolean) => void; children: ReactNode; extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border-[1.5px] bg-superficie p-4" style={{ borderColor: acceso ? 'var(--color-bordo-acceso)' : 'var(--color-superficie)' }}>
      <div className="flex items-start gap-3.5">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-inchiostro" style={{ background: colore }}>{icona}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-titolo text-[15px] font-bold">{titolo}</span>
          <span className="text-[13px] leading-snug text-tenue">{children}</span>
        </div>
        <Interruttore acceso={acceso} onCambia={onCambia} etichetta={titolo} colore={colore} />
      </div>
      {extra}
    </div>
  );
}
