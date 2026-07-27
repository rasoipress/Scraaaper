# Consegna 0.6.1

## File della release

Caricare nella release GitHub `v0.6.1`:

- `Scraaaper-0.6.1-mac-x64.dmg` — Mac Intel;
- `Scraaaper-0.6.1-mac-x64.zip` — Mac Intel, formato alternativo;
- `Scraaaper-0.6.1-mac-arm64.dmg` — Mac Apple Silicon;
- `Scraaaper-0.6.1-mac-arm64.zip` — Mac Apple Silicon, formato alternativo;
- `Scraaaper-0.6.1-win-x64.exe` — installer Windows;
- `Scraaaper-0.6.1-win-x64.zip` — Windows portatile.

I due pacchetti Mac Intel sono già presenti nella cartella locale `release`. Le build Apple Silicon e Windows devono essere prodotte dai rispettivi runner della procedura `.github/workflows/release.yml`.

## Prima di pubblicare

1. Creare un commit con tutte le modifiche della versione 0.6.1.
2. Eseguire il push di `main`.
3. Controllare che `package.json` contenga `0.6.1`.
4. Solo quando si vuole pubblicare, creare e inviare il tag `v0.6.1`.
5. Attendere che le tre build GitHub terminino.
6. Controllare che tutti i sei file elencati sopra siano presenti nella release.

La creazione del tag avvia la procedura di pubblicazione esistente. Non creare il tag finché non si desidera rendere pubblica la release.
