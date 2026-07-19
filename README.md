# Scraaaper

Scraaaper è un’app desktop gratuita per macOS e Windows che cerca libri e documenti nelle fonti selezionate.
Il motore di ricerca è incorporato nell’app: non servono Python, Terminale, server esterni o abbonamenti.

## Installazione

1. Apri la sezione **Releases** del repository GitHub (qui in alto a destra).
2. Scarica il file adatto al computer.

### Windows

- Scarica il file `.exe` con `win-x64` nel nome e segui la procedura di installazione.
- In alternativa, scarica il file `.zip` con `win-x64`, estrailo e avvia `Scraaaper.exe`: è la versione portatile.
- Poiché l’app è gratuita e non usa un certificato commerciale, Windows potrebbe mostrare un avviso SmartScreen al primo avvio. Se hai scaricato il file da questa repository, scegli **Ulteriori informazioni → Esegui comunque**.

### macOS

- Scarica il file DMG adatto al Mac:
  - `arm64` per Mac con chip Apple Silicon;
  - `x64` per Mac Intel.
- Trascina **Scraaaper** nella cartella Applicazioni.
- Poiché l’app è distribuita gratuitamente e non è firmata, al primo avvio potrebbe essere necessario fare clic destro sull’icona, scegliere **Apri** e confermare.

## Aggiornamenti

All’avvio, e successivamente ogni sei ore mentre resta aperta, l’app controlla la pagina **GitHub Releases** di `rasoipress/Scraaaper`.
Quando trova una versione più recente mostra un avviso e apre il download corretto per Windows oppure per l’architettura del Mac.

Il controllo manuale è disponibile dal menu **Aiuto → Controlla aggiornamenti…**.

## Ricerca progressiva

Le fonti vengono interrogate in parallelo e i risultati compaiono appena ciascuna fonte risponde. Durante la ricerca, un indicatore minimale mostra quante fonti sono state completate e quanti risultati sono già disponibili. Le fonti più lente continuano a lavorare senza nascondere i risultati già trovati.

## Accesso universitario JSTOR

Nell’app desktop, quando JSTOR è selezionato compare il riquadro **JSTOR per studenti**.

- **Collega università** apre la pagina ufficiale JSTOR per scegliere università o biblioteca e usare SSO, proxy o le modalità previste dall’istituzione.
- Scraaaper non riceve e non salva password, codici di autenticazione o credenziali universitarie.
- La sessione e i cookie JSTOR restano nel profilo locale dell’app sul computer dello studente.
- **Cerca su JSTOR** apre la ricerca completa di JSTOR nella stessa sessione autenticata.
- Anche i risultati JSTOR presenti nella griglia vengono aperti nella sessione collegata, così l’accesso istituzionale non viene perso.

L’accesso non viene imposto all’avvio: il riquadro è visibile ma non blocca le ricerche pubbliche. Questa integrazione richiede l’app desktop e non è disponibile nella sola versione GitHub Pages.

## Fonti e accesso

- Le fonti con API o cataloghi leggibili vengono interrogate direttamente.
- Le fonti protette o senza API vengono cercate tramite un indice web limitato al loro dominio.
- Login, CAPTCHA e condizioni di accesso dei singoli siti non vengono aggirati; l’utente effettua personalmente gli accessi previsti dai siti supportati.
- Se una fonte è temporaneamente irraggiungibile, l’app lo segnala senza mostrare risultati fittizi.

## Sviluppo locale

Sono richiesti Node.js, pnpm e Python 3 con `pyinstaller` e `certifi`.

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
