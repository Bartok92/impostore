import { useEffect, useState } from 'react';
import { MAX_NOME } from '@impostore/engine';
import { archivio } from '../archivio';
import { Pulsante, Schermo } from '../ds/componenti';
import { Ventaglio } from '../ds/Ventaglio';
import { SchermoGioco } from '../gioco/SchermoGioco';
import { vai } from '../percorso';
import { useApp } from '../store';

export function PaginaGiocatore({ codice }: { codice: string }) {
  const entra = useApp((s) => s.entraComeGiocatore);
  const identita = useApp((s) => s.identita);
  const pacchetto = useApp((s) => s.pacchetto);
  const espulso = useApp((s) => s.espulso);
  const [provaAutomatica, setProvaAutomatica] = useState(() => !!archivio.tokenGiocatore(codice));

  // Riconnessione: se questo telefono era già nella stanza, rientra da solo.
  useEffect(() => {
    if (!provaAutomatica) return;
    void entra(codice).then((r) => !r.ok && setProvaAutomatica(false));
  }, [codice, entra, provaAutomatica]);

  if (espulso) {
    return (
      <Schermo className="justify-center text-center">
        <p className="m-0 text-lg">Sei uscito dalla stanza: il Master ti ha tolto dal tavolo.</p>
        <Pulsante onClick={() => vai('/')}>Torna all'inizio</Pulsante>
      </Schermo>
    );
  }

  const dentro = identita?.tipo === 'giocatore' && identita.codice === codice && pacchetto && !pacchetto.vista.master && pacchetto.codice === codice;
  if (dentro) return <SchermoGioco pacchetto={pacchetto} />;
  if (provaAutomatica) return <Schermo className="justify-center text-center"><p className="pulsa text-tenue">Rientro nella stanza…</p></Schermo>;
  return <FormNome codice={codice} />;
}

function FormNome({ codice }: { codice: string }) {
  const entra = useApp((s) => s.entraComeGiocatore);
  const connesso = useApp((s) => s.connesso);
  const [nome, setNome] = useState(archivio.ultimoNickname);
  const [attesa, setAttesa] = useState(false);

  return (
    <Schermo className="overflow-hidden">
      <Ventaglio piccolo />
      <header className="relative flex flex-col gap-2">
        <p className="m-0 text-xs font-bold uppercase tracking-[1.5px] text-tenue">Stanza {codice}</p>
        <h1 className="m-0 font-titolo text-[34px] font-extrabold leading-none tracking-[-1px]">IMPOSTORE</h1>
      </header>
      <form
        className="relative flex flex-1 flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setAttesa(true);
          archivio.salvaNickname(nome.trim());
          await entra(codice, nome.trim());
          setAttesa(false);
        }}
      >
        <label htmlFor="nome" className="text-[13px] font-bold text-tenue">Il tuo nome al tavolo</label>
        <input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={MAX_NOME}
          autoComplete="nickname"
          className="h-15 w-full rounded-[18px] border-2 border-bordo bg-superficie px-5 text-xl font-bold text-testo outline-none focus:border-detective"
        />
        <div className="flex-1" />
        <Pulsante type="submit" disabled={!nome.trim() || attesa}>{attesa ? (connesso ? 'Entro…' : 'Cerco il telefono del Master…') : 'Entra nella stanza'}</Pulsante>
      </form>
    </Schermo>
  );
}
