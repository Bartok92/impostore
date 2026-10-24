# Impostore – regole del gioco

Questo file è la **fonte di verità** del motore (`packages/engine`). Se cambi una regola, aggiorna prima questo file.

## In breve

Tutti ricevono la stessa parola segreta… quasi tutti. A turno ognuno dice un indizio, poi si vota chi sta mentendo.

## Giocatori

- Da **3 a 20** giocatori, ognuno con il proprio telefono.
- Il **Master** crea la stanza e **gioca anche lui**: la parola la sceglie l'app a caso, quindi nemmeno il Master la conosce. In più ha i pulsanti per guidare la partita (avvia, salta un turno, chiudi il voto, prosegui).
- Si entra solo quando la stanza è in attesa (lobby). Il Master può togliere un giocatore dalla lobby.

## Ruoli

| Ruolo | Cosa riceve | Obiettivo |
|---|---|---|
| **Detective** | la parola segreta | scoprire e votare fuori gli infiltrati |
| **Impostore** | una parola **simile** (es. *spiaggia* → *lago*) e sa di essere l'impostore | confondersi e sopravvivere |
| **Mr. White** | **nessuna parola**: improvvisa | sopravvivere, oppure indovinare la parola se viene scoperto |

Impostori e Mr. White sono gli **infiltrati**.

Composizione:
- almeno 1 infiltrato;
- i detective devono essere **almeno 2** e **più degli infiltrati** (es. con 5 giocatori al massimo 2 infiltrati).
- Il numero di impostori si sceglie (0 è permesso solo con Mr. White attivo); Mr. White è al massimo uno.
- Tutti sanno **quanti** impostori e Mr. White ci sono, non **chi** sono.

## Modalità speciali (scelte dal Master in lobby)

- **Mr. White**: un giocatore non riceve nessuna parola.
- **Impostore inconsapevole**: l'impostore riceve la parola simile ma la sua carta dice "Detective": non sa di essere l'impostore. Lo scopre solo se viene eliminato.
- **Indizi a tempo**: ogni giocatore ha N secondi (default 30) per il suo indizio; allo scadere il turno passa. Lo stesso tempo vale per il tentativo di Mr. White.
- **Doppio giro**: due giri di indizi prima di ogni votazione.
- **Categoria delle parole**: Cibo, Luoghi, Animali, Oggetti, Mestieri, Sport, Personaggi oppure Casuale. Le coppie di parole già uscite nella stanza non si ripetono finché non sono finite. Quale parola delle due va ai detective è sorteggiato.

## Svolgimento

1. **Carta**: ognuno guarda la propria carta e tocca "Ho capito". Quando tutti l'hanno vista si passa agli indizi (il Master può partire prima, se qualcuno è bloccato).
2. **Indizi**: parlano a turno i giocatori ancora in gioco. Ogni giro l'ordine ruota di un posto; **Mr. White non parla mai per primo**.
   - Chi è di turno scrive un indizio (massimo 30 caratteri) oppure dice "l'ho detto a voce".
   - Non si può scrivere la propria parola segreta.
   - Il Master può saltare il turno di chi non risponde.
3. **Voto**: chi è in gioco vota in segreto un altro giocatore in gioco (non se stesso). Si può cambiare voto finché non hanno votato tutti; quando l'ultimo vota, il voto si chiude da solo. Il Master può chiuderlo prima (serve almeno un voto: chi non ha votato si considera astenuto).
4. **Verdetto**:
   - chi prende più voti è **eliminato** e si rivela il suo **ruolo** (non la sua parola: la parola si scopre solo a fine partita);
   - **pareggio** → **ballottaggio** tra i giocatori pari (votano tutti quelli in gioco, ma solo per uno dei candidati);
   - **pareggio anche al ballottaggio** → nessuno esce, si fa un nuovo giro di indizi.
5. **Mr. White eliminato**: ha **un solo tentativo** per scrivere la parola dei detective. Se indovina **vince da solo** e la partita finisce. Il confronto ignora maiuscole, accenti, spazi e apostrofi, e tollera un errore di battitura per le parole di almeno 5 lettere.
6. Se nessuno ha vinto, nuovo giro di indizi tra chi è rimasto.

## Vittoria

Si controlla dopo ogni eliminazione (e dopo il tentativo di Mr. White):

- **Vincono i detective** quando tutti gli infiltrati sono eliminati.
- **Vincono gli infiltrati** (tutti gli impostori e Mr. White, anche se eliminati) quando i detective in gioco sono **tanti quanti o meno** degli infiltrati in gioco.
- **Vince Mr. White** (da solo) se, eliminato, indovina la parola.

## Punti (classifica della stanza)

| Vittoria | Punti |
|---|---|
| Detective | +2 a ogni detective |
| Infiltrati | +3 a ogni impostore e a Mr. White |
| Mr. White indovina | +5 a Mr. White |

I punti si sommano partita dopo partita finché la stanza resta aperta. **Rivincita** = nuova partita con gli stessi giocatori e le stesse modalità; **Cambia modalità** = si torna alla lobby (possono entrare altri giocatori). Il Master può terminare una partita in corso: si torna alla lobby senza punti.

## Cosa vede chi

- Ognuno vede solo la **propria** carta (con l'impostore inconsapevole la carta dice "Detective").
- Durante il voto si vede **chi** ha già votato, non **per chi**. Dopo il verdetto si vede chi ha votato chi.
- Ruolo degli eliminati: visibile a tutti. Parole e ruoli di tutti: solo a fine partita.
