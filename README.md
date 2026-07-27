# Scraaaper

Scraaaper è un'app desktop gratuita per macOS e Windows che cerca libri, articoli e documenti nelle fonti scelte dall'utente. Il motore di ricerca è incluso nell'app: niente Python, Terminale, server a pagamento o abbonamenti.

## Installazione

Vai alla sezione **Releases** del repository (in alto a destra) oppure apri direttamente https://github.com/rasoipress/Scraaaper/releases e scarica il file adatto al tuo computer.

### Windows

Scarica il file `.exe` con `win-x64` nel nome e segui l'installazione guidata. Se preferisci la versione portatile, scarica invece il `.zip` con `win-x64`, estrailo e avvia `Scraaaper.exe`.

Scraaaper è gratuito e non usa un certificato di firma commerciale, quindi al primo avvio Windows potrebbe mostrare un avviso SmartScreen. Se hai scaricato il file da questa repository puoi procedere: **Ulteriori informazioni → Esegui comunque**.

### macOS

Scarica il DMG giusto per il tuo Mac: `arm64` per i Mac con chip Apple Silicon, `x64` per i Mac Intel. Trascina **Scraaaper** nella cartella Applicazioni.

Le build macOS usano la firma locale gratuita ad hoc, ma non sono notarizzate da Apple. Al primo avvio potrebbe quindi servire un passaggio in più:

- clic destro sull'icona, **Apri**, e conferma.
- Se macOS la blocca, vai in **Impostazioni di Sistema → Privacy e sicurezza** e conferma con **Apri comunque**.
- In alternativa utilizza il terminale, inserisci il codice **xattr -cr [trascina app] → invio**.

Una firma Developer ID e la notarizzazione, necessarie per eliminare stabilmente questi avvisi su tutti i Mac, richiedono un account Apple Developer a pagamento e non sono incluse.

## Aggiornamenti

All'avvio, e poi ogni sei ore mentre resta aperta, l'app controlla la pagina **GitHub Releases** di `rasoipress/Scraaaper`. Se trova una versione più recente te lo segnala e apre il download corretto per il tuo sistema.

Puoi controllare anche manualmente da **Aiuto → Controlla aggiornamenti…**

## Ricerca progressiva

Le fonti vengono interrogate in parallelo e i risultati compaiono man mano che ciascuna risponde. Durante la ricerca un indicatore discreto mostra quante fonti hanno finito e quanti risultati sono già disponibili. Le fonti più lente continuano a lavorare in sottofondo senza nascondere quello che hai già trovato.

Le fonti sono divise in sezioni richiudibili: **Accesso aperto**, **Fonti esterne**, **Fonti accademiche** e **Drive pubblici**. Ogni sezione può essere selezionata o azzerata in un solo gesto. Le fonti aperte affidabili sono attive al primo avvio; JSTOR, fonti esterne e Drive pubblici sono disattivati.

Lo stato è visivo: una fonte che ha risposto è piena, una fonte non raggiungibile ha il contorno più spesso e una fonte lenta ha un contorno tratteggiato. Le scritte restano solo dove è richiesto un accesso.

## Metadati, filtri e DOI

Ogni risultato mostra **autore – titolo – anno – formato**. Quando una fonte non fornisce un dato, Scraaaper lo lascia vuoto invece di inventarlo.

I controlli di ordinamento, formato e lingua sono separati visivamente. Il menu lingua permette la selezione multipla e rende grigie le lingue assenti dai risultati correnti. Sono disponibili anche un intervallo di anni e, quando supportato dai risultati accademici, il filtro multiplo per disciplina.

La stessa barra di ricerca riconosce i DOI nei formati `10.…/…`, `doi:10.…/…` e `https://doi.org/10.…/…`. Per un DOI, Scraaaper interroga le fonti selezionate e in più risolve i metadati direttamente tramite le API pubbliche e gratuite di Crossref e DataCite.

## Accesso universitario JSTOR

JSTOR è disattivato al primo avvio. Quando viene selezionato compare il riquadro **JSTOR per studenti**.

**Collega JSTOR** apre la pagina ufficiale dove scegli ateneo o biblioteca e accedi con il metodo previsto dall'istituzione. Il riquadro distingue **Non collegato**, **Collegamento in corso**, **Collegato**, **Sessione scaduta** ed **Errore di collegamento**. Sono disponibili anche **Ricollega** e **Disconnetti**.

Scraaaper non riceve e non salva password, codici di autenticazione o credenziali universitarie. La sessione e i cookie JSTOR restano nel profilo locale dell'app, sul tuo computer.

Quando la sessione è verificata, Scraaaper esegue la ricerca JSTOR nella stessa sessione e inserisce progressivamente nella griglia i risultati trovati, inclusi titolo, autore, rivista, anno e DOI quando JSTOR li espone. I collegamenti si aprono nella sessione autenticata. Scraaaper non aggira le limitazioni di accesso dell'istituzione.

L'accesso non è obbligatorio: il riquadro resta visibile ma non blocca le ricerche pubbliche. Questa integrazione richiede l'app desktop e non è disponibile nella versione GitHub Pages.

## Fonti e accesso

Le fonti con API o cataloghi leggibili vengono interrogate direttamente. Per alcune fonti pubbliche senza un'API stabile Scraaaper usa un indice web limitato al dominio originale e mostra le singole pagine trovate. Ogni risultato rimanda alla pagina di origine; non vengono più mostrate schede che aprono soltanto una nuova ricerca.

Scraaaper non aggira login, CAPTCHA o condizioni di accesso dei singoli siti: gli accessi previsti li fai tu, come faresti normalmente. Se una fonte è temporaneamente irraggiungibile l'app te lo dice, senza riempire il vuoto con risultati fittizi.

La voce **Drive pubblici**, quando attivata, cerca nell'indice pubblico pagine equivalenti a `site:drive.google.com "ricerca" (filetype:pdf OR filetype:epub)` e mostra i singoli file trovati. La stessa sezione include i PDF pubblicamente indicizzati su AWS S3. Non accede a file privati e non elude autorizzazioni.

Il resoconto completo delle integrazioni e delle esclusioni è in [SOURCES.md](SOURCES.md).

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
