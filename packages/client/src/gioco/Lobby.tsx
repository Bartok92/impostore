import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { categoria, composizione, nomeCategoria, problemiComposizione, type PacchettoVista, type Vista } from '@impostore/engine';
import { Avatar, Pulsante, PulsanteIcona, Schermo } from '../ds/componenti';
import { IconaAvanti, IconaCopia, IconaIndietro, IconaWhatsapp } from '../ds/icone';
import { linkStanza, vai } from '../percorso';
import { useApp } from '../store';
import { coloreDi, nomeDi, plurale } from '../utilita';
import { Bollino18, Modalita } from './Modalita';

export function Lobby({ pacchetto }: { pacchetto: PacchettoVista }) {
  const [passo, setPasso] = useState<'stanza' | 'modalita'>('stanza');
  const v = pacchetto.vista;
  if (!v.master) return <AttesaLobby pacchetto={pacchetto} />;
  if (passo === 'modalita') return <Modalita v={v} indietro={() => setPasso('stanza')} />;
  return <StanzaMaster pacchetto={pacchetto} avanti={() => setPasso('modalita')} />;
}

function StanzaMaster({ pacchetto, avanti }: { pacchetto: PacchettoVista; avanti: () => void }) {
  const v = pacchetto.vista;
  const connesso = useApp((s) => s.connesso);
  const invia = useApp((s) => s.invia);
  const [qr, setQr] = useState<string | null>(null);
  const [copiato, setCopiato] = useState(false);
  const link = linkStanza(pacchetto.codice);

  useEffect(() => {
    let annullato = false;
    void QRCode.toDataURL(link, { margin: 1, width: 360, color: { dark: '#110E1F', light: '#FFFFFF' } }).then((d) => !annullato && setQr(d));
    return () => {
      annullato = true;
    };
  }, [link]);

  const messaggio = `Giochiamo a Impostore! Entra nella mia stanza: ${link}`;
  const copia = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    } catch {
      prompt('Copia il link', link);
    }
  };

  return (
    <Schermo>
      <div className="flex items-center justify-between">
        <PulsanteIcona etichetta="Torna all'inizio" onClick={() => vai('/')}>
          <IconaIndietro />
        </PulsanteIcona>
        <h1 className="m-0 font-titolo text-lg font-bold">La tua stanza</h1>
        <span className={`flex items-center gap-1.5 text-[13px] font-bold ${connesso ? 'text-verde' : 'pulsa text-tenue'}`}>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${connesso ? 'bg-verde' : 'bg-tenue'}`} />
          {connesso ? 'Aperta' : 'Apro…'}
        </span>
      </div>

      <div className="flex items-center gap-[18px] rounded-3xl bg-superficie p-[18px]">
        <div className="h-[148px] w-[148px] shrink-0 overflow-hidden rounded-[14px] bg-white p-1.5">
          {qr && <img src={qr} alt={`QR per entrare nella stanza ${pacchetto.codice}`} className="h-full w-full" />}
        </div>
        <div className="flex min-w-0 flex-col gap-2.5">
          <span className="text-xs font-bold tracking-[1.5px] text-tenue">CODICE STANZA</span>
          <div className="flex gap-1">
            {pacchetto.codice.split('').map((c, i) => (
              <span key={i} className="flex h-11 w-[30px] items-center justify-center rounded-[10px] bg-superficie-2 font-titolo text-lg font-extrabold text-detective">{c}</span>
            ))}
          </div>
          <span className="text-[13px] leading-snug text-tenue">Fai inquadrare il QR agli amici con la fotocamera.</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2.5">
        <Pulsante variante="whatsapp" misura="medio" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(messaggio)}`, '_blank', 'noopener')}>
          <IconaWhatsapp /> Invita su WhatsApp
        </Pulsante>
        <Pulsante variante="contornoTesto" misura="medio" aria-label="Copia il link della stanza" onClick={() => void copia()}>
          <IconaCopia /> {copiato ? 'Fatto!' : 'Copia'}
        </Pulsante>
      </div>

      <ElencoGiocatori
        v={v}
        connessi={pacchetto.connessi}
        onTocca={(id) => {
          if (id === v.idMaster) return;
          if (confirm(`Togliere ${nomeDi(v, id)} dalla stanza?`)) void invia({ tipo: 'rimuoviGiocatore', id });
        }}
      />

      <div className="flex-1" />
      <Pulsante onClick={avanti}>
        Scegli le modalità <IconaAvanti />
      </Pulsante>
    </Schermo>
  );
}

export function ElencoGiocatori({ v, connessi, onTocca }: { v: Vista; connessi: Record<string, boolean>; onTocca?: (id: string) => void }) {
  const conPunti = v.partiteGiocate > 0;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 font-titolo text-[15px] font-bold">Giocatori</h2>
        <span className="text-sm text-tenue"><b className="text-testo">{v.giocatori.length}</b> nella stanza</span>
      </div>
      <ul className="m-0 grid list-none grid-cols-3 gap-2.5 p-0">
        {v.giocatori.map((g) => {
          const contenuto = (
            <>
              <span className="relative">
                <Avatar nome={g.nome} colore={coloreDi(v, g.id)} />
                <span
                  aria-label={connessi[g.id] ? 'collegato' : 'non collegato'}
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-superficie ${connessi[g.id] ? 'bg-verde' : 'bg-spento'}`}
                />
              </span>
              <span className="w-full truncate text-center text-sm font-bold">{g.id === v.io ? `${g.nome} (tu)` : g.nome}</span>
              {g.master && <span className="text-[10px] font-bold tracking-[1px] text-detective">MASTER</span>}
              {conPunti && <span className="text-[11px] font-bold text-tenue">{plurale(g.punti, 'punto', 'punti')}</span>}
            </>
          );
          const stile = 'flex w-full flex-col items-center gap-1.5 rounded-[18px] bg-superficie px-1.5 pb-2.5 pt-3';
          return (
            <li key={g.id} className="compari">
              {onTocca && !g.master ? (
                <button type="button" className={stile} onClick={() => onTocca(g.id)} aria-label={`${g.nome}: tocca per toglierlo dalla stanza`}>
                  {contenuto}
                </button>
              ) : (
                <div className={stile}>{contenuto}</div>
              )}
            </li>
          );
        })}
      </ul>
      {onTocca && v.giocatori.length > 1 && <p className="m-0 text-center text-xs text-spento">Tocca un giocatore per toglierlo dalla stanza.</p>}
    </section>
  );
}

/** Per gli amici: si aspetta che il Master avvii. */
function AttesaLobby({ pacchetto }: { pacchetto: PacchettoVista }) {
  const v = pacchetto.vista;
  const imp = v.impostazioni;
  const comp = composizione(v.giocatori.length, imp);
  const problemi = problemiComposizione(v.giocatori.length, imp);
  const master = nomeDi(v, v.idMaster);
  const adulti = imp.categoria !== 'casuale' && !!categoria(imp.categoria).adulti;
  const modalita = [
    imp.mrWhite && 'Mr. White',
    imp.inconsapevole && comp.impostori > 0 && 'Impostore inconsapevole',
    imp.indiziATempo && `Indizi a tempo (${imp.secondiIndizio} s)`,
    imp.doppioGiro && 'Doppio giro',
  ].filter(Boolean) as string[];

  return (
    <Schermo>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[1.5px] text-tenue">Stanza {pacchetto.codice}</span>
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-verde"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-verde" />Dentro</span>
      </div>
      <h1 className="m-0 font-titolo text-[28px] font-extrabold leading-tight tracking-[-0.5px]">Sei nella stanza di {master}</h1>

      <ElencoGiocatori v={v} connessi={pacchetto.connessi} />

      <section className="flex flex-col gap-2.5 rounded-[20px] bg-superficie p-4">
        <h2 className="m-0 text-xs font-bold uppercase tracking-[1.5px] text-tenue">Come si gioca questa volta</h2>
        <p className="m-0 flex items-center gap-1.5">
          Categoria: <b className={adulti ? 'text-impostore' : ''}>{nomeCategoria(imp.categoria)}</b>
          {adulti && <Bollino18 />}
        </p>
        <p className="m-0">
          {problemi.length ? (
            <span className="text-tenue">{problemi[0]}</span>
          ) : (
            [`${comp.detective} detective`, comp.impostori > 0 && plurale(comp.impostori, 'impostore', 'impostori'), comp.mrWhite > 0 && '1 Mr. White'].filter(Boolean).join(' · ')
          )}
        </p>
        {modalita.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {modalita.map((m) => <span key={m} className="rounded-full bg-superficie-2 px-3 py-1 text-[13px] font-bold">{m}</span>)}
          </div>
        )}
      </section>

      <div className="flex-1" />
      <p className="pulsa m-0 text-center text-tenue">Aspetta che {master} avvii la partita…</p>
    </Schermo>
  );
}
