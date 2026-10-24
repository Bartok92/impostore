import { useEffect, useState } from 'react';
import { archivio } from '../archivio';
import { Pulsante, Schermo } from '../ds/componenti';
import { SchermoGioco } from '../gioco/SchermoGioco';
import { useWakeLock } from '../hooks';
import { vai } from '../percorso';
import { useApp } from '../store';

export function PaginaMaster({ codice }: { codice: string }) {
  const entra = useApp((s) => s.entraComeMaster);
  const pacchetto = useApp((s) => s.pacchetto);
  const [problema, setProblema] = useState<string | null>(null);
  // Il telefono del Master tiene la partita: deve restare acceso.
  useWakeLock(true);

  useEffect(() => {
    const token = archivio.tokenMaster(codice);
    if (!token) {
      setProblema('Su questo telefono non risulti il Master di questa stanza.');
      return;
    }
    void entra(codice, token).then((r) => !r.ok && setProblema(r.errore));
  }, [codice, entra]);

  if (problema) {
    return (
      <Schermo className="justify-center text-center">
        <p className="m-0 text-lg">{problema}</p>
        <Pulsante onClick={() => vai('/')}>Torna all'inizio</Pulsante>
      </Schermo>
    );
  }
  if (!pacchetto || !pacchetto.vista.master || pacchetto.codice !== codice) {
    return <Schermo className="justify-center text-center"><p className="pulsa text-tenue">Apro la stanza…</p></Schermo>;
  }
  return <SchermoGioco pacchetto={pacchetto} />;
}
