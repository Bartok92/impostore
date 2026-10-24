import { useEffect, useState, type FormEvent } from 'react';
import { LUNGHEZZA_CODICE, MAX_NOME, normalizzaCodice } from '@impostore/engine';
import { archivio } from '../archivio';
import { Pulsante, PulsanteIcona, Schermo } from '../ds/componenti';
import { IconaCroce, IconaIndietro, IconaPiu, IconaScansiona } from '../ds/icone';
import { Ventaglio } from '../ds/Ventaglio';
import { vai } from '../percorso';
import { creaStanza, dimenticaStanzaOspitata } from '../rete/connessione';
import { stanzeSalvate, type StanzaSalvata } from '../rete/p2p/archivioIdb';

const NOME_FASE: Record<string, string> = {
  lobby: 'in attesa', parola: 'carte', indizi: 'indizi', voto: 'voto', verdetto: 'verdetto', mrwhite: 'Mr. White', fine: 'finita',
};

type Passo = 'inizio' | 'crea' | 'entra';

export function Home() {
  const [passo, setPasso] = useState<Passo>('inizio');
  const [salvate, setSalvate] = useState<StanzaSalvata[]>([]);

  const ricarica = () => void stanzeSalvate().then((s) => setSalvate(s.filter((x) => archivio.tokenMaster(x.codice)))).catch(() => setSalvate([]));
  useEffect(ricarica, []);

  if (passo === 'crea') return <FormCrea indietro={() => setPasso('inizio')} />;
  if (passo === 'entra') return <FormEntra indietro={() => setPasso('inizio')} />;

  return (
    <Schermo className="overflow-hidden">
      <Ventaglio />
      <header className="relative flex flex-col gap-3">
        <h1 className="m-0 font-titolo text-[42px] font-extrabold leading-none tracking-[-1.5px]">IMPOSTORE</h1>
        <p className="m-0 text-lg leading-snug text-tenue">Tutti hanno la stessa parola.<br />Quasi tutti.</p>
      </header>

      <div className="flex-1" />

      {salvate.length > 0 && (
        <section className="relative flex flex-col gap-2">
          <h2 className="m-0 text-xs font-bold uppercase tracking-[1.5px] text-tenue">Le tue stanze su questo telefono</h2>
          {salvate.slice(0, 3).map((s) => (
            <div key={s.codice} className="flex items-center gap-2 rounded-2xl bg-superficie py-1 pl-4 pr-1">
              <span className="font-titolo font-bold tracking-[2px] text-detective">{s.codice}</span>
              <span className="flex-1 text-sm text-tenue">{s.giocatori} giocatori · {NOME_FASE[s.fase] ?? s.fase}</span>
              <button className="min-h-11 px-3 font-bold text-detective" onClick={() => vai(`/master/${s.codice}`)}>Riprendi</button>
              <PulsanteIcona
                etichetta={`Elimina la stanza ${s.codice}`}
                className="border-0 text-spento"
                onClick={() => confirm(`Eliminare la stanza ${s.codice} da questo telefono?`) && void dimenticaStanzaOspitata(s.codice).then(ricarica)}
              >
                <IconaCroce size={16} />
              </PulsanteIcona>
            </div>
          ))}
        </section>
      )}

      <div className="relative flex flex-col gap-3">
        <Pulsante onClick={() => setPasso('crea')}>
          <IconaPiu /> Crea una stanza
        </Pulsante>
        <Pulsante variante="contorno" onClick={() => setPasso('entra')}>
          <IconaScansiona /> Entra con un codice
        </Pulsante>
        <p className="m-0 mt-1.5 text-center text-[13px] text-spento">Da 3 a 20 giocatori · un telefono a testa</p>
      </div>
    </Schermo>
  );
}

function Intestazione({ titolo, indietro }: { titolo: string; indietro: () => void }) {
  return (
    <div className="flex items-center gap-3.5">
      <PulsanteIcona etichetta="Indietro" onClick={indietro}>
        <IconaIndietro />
      </PulsanteIcona>
      <h1 className="m-0 font-titolo text-xl font-bold">{titolo}</h1>
    </div>
  );
}

const STILE_CAMPO = 'h-15 w-full rounded-[18px] border-2 border-bordo bg-superficie px-5 text-xl font-bold text-testo outline-none focus:border-detective';

function FormCrea({ indietro }: { indietro: () => void }) {
  const [nome, setNome] = useState(archivio.ultimoNickname);
  const [attesa, setAttesa] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function crea(e: FormEvent) {
    e.preventDefault();
    setAttesa(true);
    setErrore(null);
    try {
      archivio.salvaNickname(nome.trim());
      const s = await creaStanza(nome.trim());
      archivio.salvaTokenMaster(s.codice, s.tokenMaster);
      vai(`/master/${s.codice}`);
    } catch (err) {
      setErrore((err as Error).message);
      setAttesa(false);
    }
  }

  return (
    <Schermo>
      <Intestazione titolo="Crea una stanza" indietro={indietro} />
      <p className="m-0 text-tenue">Il tuo telefono farà da tavolo: tieni l'app aperta per tutta la partita. Anche tu giochi: la parola la sceglie l'app, a caso.</p>
      <form className="flex flex-1 flex-col gap-3" onSubmit={crea}>
        <label htmlFor="nome-master" className="text-[13px] font-bold text-tenue">Il tuo nome</label>
        <input id="nome-master" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={MAX_NOME} autoComplete="nickname" className={STILE_CAMPO} />
        {errore && <p className="m-0 text-impostore">{errore}</p>}
        <div className="flex-1" />
        <Pulsante type="submit" disabled={!nome.trim() || attesa}>{attesa ? 'Preparo la stanza…' : 'Apri la stanza'}</Pulsante>
      </form>
    </Schermo>
  );
}

function FormEntra({ indietro }: { indietro: () => void }) {
  const [codice, setCodice] = useState('');
  const pulito = normalizzaCodice(codice);
  return (
    <Schermo>
      <Intestazione titolo="Entra in una stanza" indietro={indietro} />
      <p className="m-0 text-tenue">Scrivi il codice che vedi sul telefono del Master, oppure inquadra il suo QR con la fotocamera.</p>
      <form className="flex flex-1 flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (pulito) vai(`/g/${pulito}`); }}>
        <label htmlFor="codice" className="text-[13px] font-bold text-tenue">Codice stanza</label>
        <input
          id="codice"
          value={codice}
          onChange={(e) => setCodice(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={LUNGHEZZA_CODICE + 2}
          placeholder="K4XPQ"
          className={`${STILE_CAMPO} text-center font-titolo text-3xl tracking-[0.3em] text-detective placeholder:text-bordo`}
        />
        <div className="flex-1" />
        <Pulsante type="submit" disabled={pulito.length < LUNGHEZZA_CODICE}>Entra</Pulsante>
      </form>
    </Schermo>
  );
}
