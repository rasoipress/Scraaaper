# Scraaaper

Scraaaper è un’app desktop gratuita per macOS e Windows che cerca libri e documenti nelle fonti selezionate.
Il motore di ricerca è incorporato nell’app: non servono Python, Terminale, server esterni o abbonamenti.

## Installazione

1. Apri la sezione **Releases** del repository GitHub (qui in alto a destra).
2. Scarica il file DMG adatto al mac o il file EXE per Windows:
   - `arm64` per Mac con chip Apple Silicon;
   - `x64` per Mac Intel.
3. Trascina **Scraaaper** nella cartella Applicazioni o procedi all'installazione nel caso di Windows.
4. Poiché l’app è distribuita gratuitamente e non è firmata, al primo avvio potrebbe essere necessario fare clic destro sull’icona, scegliere **Apri** e confermare.

## Aggiornamenti

All’avvio, e successivamente ogni sei ore mentre resta aperta, l’app controlla la pagina **GitHub Releases** di `rasoipress/Scraaaper`.
Quando trova una versione più recente mostra un avviso e apre il download corretto per l’architettura del Mac.

Il controllo manuale è disponibile dal menu **Aiuto → Controlla aggiornamenti…**.

## Fonti e accesso

- Le fonti con API o cataloghi leggibili vengono interrogate direttamente.
- Le fonti protette o senza API vengono cercate tramite un indice web limitato al loro dominio.
- Login, CAPTCHA e condizioni di accesso dei singoli siti non vengono aggirati.
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


