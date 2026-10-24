# Impostore – app da cellulare

**Tutti hanno la stessa parola. Quasi tutti.**

Party game di parole e bluff: il **Master** crea la stanza, gli amici **scansionano il QR** (o ricevono l'invito su WhatsApp) e giocano ciascuno dal proprio telefono. Regole complete e modalità speciali: [RULES.md](RULES.md).

## Come si gioca a casa di amici

1. Il Master apre l'app e tocca **Crea una stanza**: il suo telefono diventa il **tavolo**. Aspetta la scritta *Aperta*.
2. Gli amici inquadrano il **QR** con la fotocamera (oppure il Master tocca **Invita su WhatsApp**) e scrivono il loro nome.
3. Il Master sceglie categoria e **modalità speciali** (Mr. White, impostore inconsapevole, indizi a tempo, doppio giro) e avvia.
4. Ognuno guarda la sua carta in segreto, poi a turno indizi → voto → verdetto, finché vincono i detective o gli infiltrati.

Da sapere:
- Il Master **gioca anche lui**: la parola la sceglie l'app a caso.
- Il telefono del Master **tiene la partita**: deve restare sull'app (lo schermo resta acceso da solo). Se si chiude, basta riaprirla: la stanza riparte da *Le tue stanze su questo telefono* e gli amici si ricollegano.
- Se il telefono di un amico si blocca o ricarica la pagina, **rientra da solo** con la stessa carta.
- Serve internet solo per "presentarsi": i dati viaggiano **direttamente da telefono a telefono** (WebRTC tramite il servizio pubblico gratuito PeerJS).

## Architettura

Stessa struttura di *Lupus in Tabula*: monorepo pnpm + TypeScript.

| Pacchetto | Contenuto |
|---|---|
| `packages/engine` | Motore di gioco puro: regole, parole, viste filtrate per giocatore, **Stanza** (sessioni, riconnessione, turni a tempo). |
| `packages/client` | React + Vite + Tailwind + Zustand, PWA installabile. Contiene l'**host** della partita per il telefono del Master (`src/rete/p2p`). |

## Pubblicare su GitHub Pages (gratis)

1. Crea un repository su GitHub e carica il progetto (ramo `main`).
2. Su GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. A ogni `git push` il workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) esegue i test, compila l'app e la pubblica su `https://<utente>.github.io/<repository>/`.

## Sviluppo locale

Requisiti: Node ≥ 22, pnpm.

```bash
pnpm install
pnpm dev        # app su http://localhost:5174
pnpm test       # test di motore e rete
pnpm typecheck
```

- **Più giocatori nello stesso browser**: apri altre schede con `?prova=2`, `?prova=3`… prima del `#` (es. `http://localhost:5174/?prova=2#/g/CODICE`). Ogni numero è un "telefono" diverso.
- Icone dell'app: si rigenerano da `packages/client/public/icona.svg` con `pnpm --filter @impostore/client exec pwa-assets-generator --override`.
- Nuove parole: `packages/engine/src/parole.ts` (coppie di parole simili per categoria).
