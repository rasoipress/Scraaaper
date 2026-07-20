# Scraaaper

Scraaaper è un'app desktop gratuita per macOS e Windows che cerca libri e documenti nelle fonti che scegli tu. Il motore di ricerca è dentro l'app: niente Python, niente Terminale, niente server esterni, nessun abbonamento.

## Installazione

Vai alla sezione **Releases** del repository (in alto a destra) oppure apri direttamente https://github.com/rasoipress/Scraaaper/releases e scarica il file adatto al tuo computer.

### Windows

Scarica il file `.exe` con `win-x64` nel nome e segui l'installazione guidata. Se preferisci la versione portatile, scarica invece il `.zip` con `win-x64`, estrailo e avvia `Scraaaper.exe`.

Scraaaper è gratuito e non usa un certificato di firma commerciale, quindi al primo avvio Windows potrebbe mostrare un avviso SmartScreen. Se hai scaricato il file da questa repository puoi procedere: **Ulteriori informazioni → Esegui comunque**.

### macOS

Scarica il DMG giusto per il tuo Mac: `arm64` per i Mac con chip Apple Silicon, `x64` per i Mac Intel. Trascina **Scraaaper** nella cartella Applicazioni.

Anche qui l'app non è firmata, quindi al primo avvio serve un passaggio in più: clic destro sull'icona, **Apri**, e conferma. Se compare un errore del tipo "file danneggiato", premi Annulla e vai in **Impostazioni di Sistema → Privacy e sicurezza**; scorri fino in fondo e conferma con **Apri comunque**.
Altrimenti apri il **Terminale → scrivi xattr -cr "drag and drop dell'app" → invio.** (dopo il codice lasciare uno spazio e spostare l'app dentro il terminale, poi premere invio). In questo modo verrà tolta la quarantena dall'app e si aprirà normalmente.

## Aggiornamenti

All'avvio, e poi ogni sei ore mentre resta aperta, l'app controlla la pagina **GitHub Releases** di `rasoipress/Scraaaper`. Se trova una versione più recente te lo segnala e apre il download corretto per il tuo sistema.

Puoi controllare anche manualmente da **Aiuto → Controlla aggiornamenti…**

## Ricerca progressiva

Le fonti vengono interrogate in parallelo e i risultati compaiono man mano che ciascuna risponde. Durante la ricerca un indicatore discreto mostra quante fonti hanno finito e quanti risultati sono già disponibili. Le fonti più lente continuano a lavorare in sottofondo senza nascondere quello che hai già trovato.

## Metadati, filtri e DOI

Ogni risultato mostra **autore – titolo – anno – formato**. Quando una fonte non fornisce un dato, Scraaaper lo lascia vuoto invece di inventarlo.

I controlli di ordinamento, formato e lingua sono separati visivamente. Il menu lingua permette la selezione multipla e rende grigie le lingue assenti dai risultati correnti.

La stessa barra di ricerca riconosce i DOI nei formati `10.…/…`, `doi:10.…/…` e `https://doi.org/10.…/…`. Per un DOI, Scraaaper interroga le fonti selezionate e in più risolve i metadati direttamente tramite le API pubbliche e gratuite di Crossref e DataCite.

## Accesso universitario JSTOR

Quando JSTOR è tra le fonti selezionate compare il riquadro **JSTOR per studenti**.

**Collega università** apre la pagina ufficiale JSTOR dove scegli il tuo ateneo o la tua biblioteca e accedi con SSO, proxy o il metodo previsto dalla tua istituzione. Il riquadro mostra sempre lo stato corrente — **Non collegato**, **Verifica in corso** o **Collegato** — e ricontrolla JSTOR automaticamente al termine del flusso universitario. Se il portale del tuo ateneo non ti riporta su JSTOR da solo, **Verifica accesso** apre JSTOR nella stessa sessione e aggiorna lo stato.

Scraaaper non riceve e non salva password, codici di autenticazione o credenziali universitarie. La sessione e i cookie JSTOR restano nel profilo locale dell'app, sul tuo computer.

**Cerca su JSTOR** apre la ricerca completa nella sessione autenticata, e anche i risultati JSTOR presenti nella griglia si aprono nella stessa sessione, così non perdi l'accesso istituzionale.

L'accesso non è obbligatorio: il riquadro resta visibile ma non blocca le ricerche pubbliche. Questa integrazione richiede l'app desktop e non è disponibile nella versione GitHub Pages.

## Fonti e accesso

Le fonti con API o cataloghi leggibili vengono interrogate direttamente. Quelle protette o senza API vengono cercate tramite un indice web limitato al loro dominio.

Scraaaper non aggira login, CAPTCHA o condizioni di accesso dei singoli siti: gli accessi previsti li fai tu, come faresti normalmente. Se una fonte è temporaneamente irraggiungibile l'app te lo dice, senza riempire il vuoto con risultati fittizi.

## Sviluppo locale

Servono Node.js, pnpm e Python 3 con `pyinstaller` e `certifi`.

```sh
pnpm install
pnpm start
```

Per creare il pacchetto per il Mac corrente:

```sh
python3 -m pip install pyinstaller certifi
pnpm run dist:mac
```

Su Windows, dopo aver installato le stesse dipendenze:

```powershell
python -m pip install pyinstaller certifi
pnpm run dist:win
```
