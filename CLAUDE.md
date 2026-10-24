# Impostore – note per Claude

- Parla in italiano; interfaccia e nomi di dominio in italiano (codice: identificatori in italiano per il dominio).
- Le regole di gioco sono in `RULES.md`: è la fonte di verità del motore. Se cambi una regola, aggiorna prima RULES.md.
- Architettura (scelta dell'utente, come Lupus in Tabula): **il telefono del Master fa da server** (WebRTC via PeerJS, app statica su GitHub Pages). Niente server Node.
- Il **Master gioca anche lui**: è un giocatore con id `stato.idMaster`; i comandi riservati controllano `attore.id === idMaster`.
- Il motore (`packages/engine`) è puro: niente I/O, niente `Math.random` né `Date.now` (casualità e ora arrivano dal `Contesto`).
- La logica della partita ospitata è `Stanza` (engine), usata da `packages/client/src/rete/p2p/host.ts`. Cambia lì, non duplicare.
- Agli altri telefoni arrivano solo viste filtrate (`vistaPer`). Ogni nuovo dato segreto richiede un test di filtraggio.
- Testi rivolti alle persone: forma neutra, senza indovinare il genere dal nome.
- Grafica: tela di design https://claude.ai/artifact/DUbVj5UFWSDc5FCN6p8u7F (tema scuro, giallo detective / corallo impostore / bianco Mr. White, Unbounded + DM Sans). Niente immagini o audio coperti da copyright.
- Dev server: configurazione `impostore` in `D:\Claude\.claude\launch.json` (porta 5174). Più giocatori nello stesso browser con `?prova=N`.
- Si lavora per milestone e ci si ferma a fine milestone per mostrare il risultato.
