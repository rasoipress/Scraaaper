# Scraaaper

Scraaaper is a free desktop app for macOS and Windows that searches for books, articles, and documents across sources selected by the user. The search engine is built into the app: no Python, Terminal, paid servers, or subscriptions required.

## VPN notice

Since August 2026, several free online library websites have been blocked in Italy. To use Scraaaper, you therefore need an active, working VPN; otherwise, searches on unrecognised libraries will not run.

## Installation

Go to the repository’s **Releases** section, or open [github.com/rasoipress/Scraaaper/releases](https://github.com/rasoipress/Scraaaper/releases) directly, then download the file for your computer.

### Windows

Download the `.exe` file with `win-x64` in its name and follow the installation wizard. If you prefer the portable version, download the `.zip` file with `win-x64`, extract it, and launch `Scraaaper.exe`.

Scraaaper is free and does not use a commercial code-signing certificate, so Windows may display a SmartScreen warning the first time you open it. If you downloaded the file from this repository, you can continue: **More info → Run anyway**.

### macOS

Download the correct DMG for your Mac: `arm64` for Macs with Apple Silicon chips, or `x64` for Intel Macs. Drag **Scraaaper** into the Applications folder.

The macOS builds use a free local ad hoc signature, but they are not notarised by Apple. The first launch may therefore require an extra step:

- Right-click the icon, choose **Open**, then confirm.
- If macOS blocks the app, go to **System Settings → Privacy & Security** and confirm with **Open Anyway**.
- Alternatively, open Terminal and enter `xattr -cr [drag the app here]`, then press Return.

A Developer ID signature and notarisation, required to permanently remove these warnings on all Macs, require a paid Apple Developer account and are not included.

## Updates

When launched, and then every six hours while it remains open, the app checks the **GitHub Releases** page for `rasoipress/Scraaaper`. If a newer version is available, it lets you know and opens the correct download for your system.

You can also check manually via **Help → Check for Updates…**

## Progressive search

Sources are queried in parallel, and results appear as each one responds. During a search, a small indicator shows how many sources have finished and how many results are already available. Slower sources continue working in the background without hiding what you have already found.

Sources are grouped into collapsible sections: **Open Access**, **External Sources**, **Academic Sources**, and **Public Drives**. Each section can be selected or cleared in one action. Reliable open sources are enabled on first launch; JSTOR, external sources, and public drives are disabled.

Status is shown visually: a source that has responded is filled, an unreachable source has a thicker outline, and a slow source has a dashed outline. Labels are shown only where login is required.

## Metadata, filters, and DOI

Each result shows **author – title – year – format**. When a source does not provide a field, Scraaaper leaves it blank rather than inventing it.

Sorting, format, and language controls are visually separated. The language menu supports multiple selection and greys out languages not represented in the current results. A year range is also available, along with a multi-select discipline filter when supported by academic results.

***
***
***


# Scraaaper

Scraaaper è un'app desktop gratuita per macOS e Windows che cerca libri, articoli e documenti nelle fonti scelte dall'utente. Il motore di ricerca è incluso nell'app: niente Python, Terminale, server a pagamento o abbonamenti.

## Attenzione, VPN

Da agosto 2026 in Italia sono stati bloccati numerosi siti di librerie online gratuite. Per utilizzare Scraaaper è quindi necessario avere una VPN attiva e funzionante; altrimenti la ricerca sulle librerie non riconosciute non verrà effettuata.

## Installazione

Vai alla sezione **Releases** del repository, oppure apri direttamente [github.com/rasoipress/Scraaaper/releases](https://github.com/rasoipress/Scraaaper/releases), e scarica il file adatto al tuo computer.

### Windows

Scarica il file `.exe` con `win-x64` nel nome e segui l'installazione guidata. Se preferisci la versione portatile, scarica invece il `.zip` con `win-x64`, estrailo e avvia `Scraaaper.exe`.

Scraaaper è gratuito e non usa un certificato di firma commerciale, quindi al primo avvio Windows potrebbe mostrare un avviso SmartScreen. Se hai scaricato il file da questo repository, puoi procedere: **Ulteriori informazioni → Esegui comunque**.

### macOS

Scarica il DMG giusto per il tuo Mac: `arm64` per i Mac con chip Apple Silicon, `x64` per i Mac Intel. Trascina **Scraaaper** nella cartella Applicazioni.

Le build macOS usano una firma locale gratuita ad hoc, ma non sono notarizzate da Apple. Al primo avvio potrebbe quindi servire un passaggio in più:

- Fai clic con il tasto destro sull'icona, scegli **Apri** e conferma.
- Se macOS blocca l'app, vai in **Impostazioni di Sistema → Privacy e sicurezza** e conferma con **Apri comunque**.
- In alternativa, apri il Terminale e inserisci `xattr -cr [trascina qui l'app]`, quindi premi Invio.

Una firma Developer ID e la notarizzazione, necessarie per eliminare stabilmente questi avvisi su tutti i Mac, richiedono un account Apple Developer a pagamento e non sono incluse.

## Aggiornamenti

All'avvio, e poi ogni sei ore mentre resta aperta, l'app controlla la pagina **GitHub Releases** di `rasoipress/Scraaaper`. Se trova una versione più recente, te lo segnala e apre il download corretto per il tuo sistema.

Puoi controllare anche manualmente da **Aiuto → Controlla aggiornamenti…**

## Ricerca progressiva

Le fonti vengono interrogate in parallelo e i risultati compaiono man mano che ciascuna risponde. Durante la ricerca, un indicatore discreto mostra quante fonti hanno finito e quanti risultati sono già disponibili. Le fonti più lente continuano a lavorare in sottofondo senza nascondere quello che hai già trovato.

Le fonti sono divise in sezioni richiudibili: **Accesso aperto**, **Fonti esterne**, **Fonti accademiche** e **Drive pubblici**. Ogni sezione può essere selezionata o azzerata in un solo gesto. Le fonti aperte affidabili sono attive al primo avvio; JSTOR, fonti esterne e Drive pubblici sono disattivati.

Lo stato è visivo: una fonte che ha risposto è piena, una fonte non raggiungibile ha il contorno più spesso e una fonte lenta ha un contorno tratteggiato. Le scritte restano solo dove è richiesto un accesso.

## Metadati, filtri e DOI

Ogni risultato mostra **autore – titolo – anno – formato**. Quando una fonte non fornisce un dato, Scraaaper lo lascia vuoto invece di inventarlo.

I controlli di ordinamento, formato e lingua sono separati visivamente. Il menu lingua permette la selezione multipla e rende grigie le lingue assenti dai risultati correnti. Sono disponibili anche un intervallo di anni e, quando supportato dai risultati accademici, il filtro multiplo per disciplina.

