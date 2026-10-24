import { Component, type ReactNode } from 'react';
import { IconaCroce } from './ds/icone';
import { Home } from './pagine/Home';
import { PaginaGiocatore } from './pagine/PaginaGiocatore';
import { PaginaMaster } from './pagine/PaginaMaster';
import { usePercorso } from './percorso';
import { useApp } from './store';

export function App() {
  const percorso = usePercorso();
  const [, sezione, codice] = percorso.split('/');

  let pagina = <Home />;
  if (sezione === 'master' && codice) pagina = <PaginaMaster key={codice} codice={codice.toUpperCase()} />;
  if (sezione === 'g' && codice) pagina = <PaginaGiocatore key={codice} codice={codice.toUpperCase()} />;

  return (
    <Paracadute>
      {pagina}
      <Avviso />
    </Paracadute>
  );
}

/**
 * Se qualcosa va storto, niente schermo nero: si mostra un messaggio e si ricarica.
 * La stanza è salvata sul telefono del Master e riparte da dov'era.
 */
class Paracadute extends Component<{ children: ReactNode }, { errore: Error | null }> {
  state = { errore: null as Error | null };
  static getDerivedStateFromError(errore: Error) {
    return { errore };
  }
  render() {
    if (!this.state.errore) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-titolo text-2xl font-bold text-impostore">Ops, un intoppo</p>
        <p className="text-tenue">Qualcosa è andato storto. La partita è salvata: ricarica e si riparte da dove eravate.</p>
        <button className="h-14 rounded-2xl bg-detective px-6 font-titolo font-bold text-inchiostro" onClick={() => location.reload()}>
          Ricarica
        </button>
        <p className="max-w-sm break-words text-xs text-spento">{this.state.errore.message}</p>
      </div>
    );
  }
}

/** Comando rifiutato o rete assente: avviso in alto, si chiude toccandolo. */
function Avviso() {
  const errore = useApp((s) => s.errore);
  const pulisci = useApp((s) => s.pulisciErrore);
  if (!errore) return null;
  return (
    <button
      role="alert"
      onClick={pulisci}
      className="compari fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] mx-auto flex max-w-md items-start gap-3 rounded-2xl border-[1.5px] border-impostore bg-superficie px-4 py-3 text-left text-testo shadow-2xl"
    >
      <span className="flex-1">{errore}</span>
      <IconaCroce size={18} className="mt-0.5 text-tenue" />
    </button>
  );
}
