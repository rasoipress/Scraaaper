# Stato delle fonti

Scraaaper non simula risultati e non aggira account, CAPTCHA, paywall o limitazioni istituzionali.

## Integrate con ricerca diretta

- Internet Archive: API pubblica per ricerca e metadati; nessuna automazione del prestito.
- FreeBannedBooks: catalogo pubblico.
- Project Gutenberg: API pubblica Gutendex.
- Inventaire: API pubblica.
- Open Library: API pubblica.
- Standard Ebooks: catalogo pubblico.
- Wikisource e Wikibooks: API Wikimedia.
- Crossref e DataCite: risoluzione DOI.
- JSTOR: ricerca in una sessione desktop istituzionale verificata; richiede accesso dell'utente ed è disattivata all'avvio.

## Integrate tramite risultati di un indice web

Queste fonti non espongono tutte un'API pubblica stabile. Scraaaper interroga un indice web limitato al loro dominio e mostra le singole pagine trovate, senza presentarle come dati ottenuti direttamente dal sito:

- Unglue.it, Page by Page Books, ManyBooks, JustFreeBooks, Global Grey;
- The Literature Network, DPLA, Faded Page, E-Book Mecca;
- Planet eBook, Loyal Books, Planet Publish, Baen;
- Ebookzy, By the Fireplace, DigiLibraries, Ex-Classics;
- H. P. Lovecraft Archive, sherlock-holm.es, GrimmStories, AndersenStories;
- Public Domain Review, Monoskop e CORE;
- ResearchGate e Academia, limitatamente alle pagine pubbliche indicizzate e senza automatizzare login o download;
- PDF pubblici su AWS S3;
- Google Drive pubblico, con frase esatta e formati PDF ed EPUB.

La disponibilità può variare in base all'indice web, al paese e alle condizioni del sito.

## Fonti esterne mantenute, disattivate all'avvio

Le fonti esterne già presenti restano opzionali e isolate dagli altri provider: Anna's Archive, BDE Books, Bookracy, Booksee, Ebookoz, Liber3, LibGen, Mobilism, Scribd e Z-Library. Scraaaper non aggiunge nuovi mirror, non automatizza download e non supera protezioni di accesso.

## Escluse

- MyAnonamouse e Bookstagram;
- servizi esclusivamente Telegram o I2P;
- Calibre, perché non è un motore di ricerca remoto;
- siti che richiedono obbligatoriamente un account, salvo JSTOR;
- provider senza ricerca funzionante o che richiedono CAPTCHA/protezioni incompatibili;
- OceanOfPDF, PDF Room, Ebook PDF, KuPDF, ePDF, PDFCoffee, PDFCookie e iDoc: non integrati come motori automatici perché non offrono un'API pubblica affidabile e possono indicizzare materiale non autorizzato;
- nuovi domini alternativi di Anna's Archive, Z-Library e LibGen: non aggiunti.
