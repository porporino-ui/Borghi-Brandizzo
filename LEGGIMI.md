# Borghi di Brandizzo — Admin per v3.28

Il pacchetto parte da `index_v3_28_safari_geolocation.html`. La mappa mantiene gli stili, la welcome page, la toolbar e la geolocalizzazione Safari originali. L'area riservata è `admin.html`, con la sola password condivisa: non viene aggiunto un pulsante alla mappa pubblica.

**Stato: file pronti e testati localmente; servizio Supabase e pubblicazione non ancora attivati.** Senza configurazione la mappa mostra i dati originali e Admin indica che è necessaria la configurazione.

## Attivazione

1. Crea un progetto dedicato su [Supabase](https://supabase.com/dashboard). Conserva privatamente la password del database. Non occorre un server da amministrare.
2. Nel SQL Editor esegui `01-schema.sql` una sola volta, poi `02-seed.sql`. Il secondo file registra i 2.687 identificativi dei civici e i nomi dei borghi ammessi. Non sovrascrive modifiche già salvate.
3. In Authentication, disabilita le nuove registrazioni pubbliche. Lascia abilitato l'accesso tramite email e password. Crea un unico account amministratore condiviso da Authentication → Users e imposta lì la password che darai agli admin. Assicurati che l'email dell'account sia confermata. Non inviare la password in chat e non inserirla nei file del sito.
4. Copia l'UUID dell'utente creato, sostituisci il segnaposto in `03-authorize-admin.sql` ed esegui il comando nel SQL Editor. L'esistenza di un account, da sola, non concede il diritto di modificare la mappa.
5. Dalle impostazioni del progetto copia URL del progetto e **publishable key**. Compila questi due valori e `adminEmail` in `config.js`: per quest’ultimo usa l’email dell’account condiviso. L’email è un identificativo pubblico e non viene richiesta agli admin nel modulo. La chiave pubblicabile può stare su GitHub. Non usare chiavi `service_role`, `sb_secret_...`, token personali o password.
6. Conserva una copia della versione precedente del repository. Carica nella stessa cartella su GitHub Pages questi nove file: `index.html`, `coordinates.html`, `admin.html`, `admin.css`, `admin.js`, `config.js`, `store.js`, `catalog.json`, `.nojekyll`. Non occorre caricare file SQL, guida o test.
7. Apri il sito HTTPS e aggiungi `/admin.html` al percorso della cartella della mappa. Esempio: `https://fra22-oss.github.io/Mappa-borghi-Brandizzo-/admin.html`. Inserisci soltanto la password dell’account condiviso.
8. Cambia un colore e un civico, controlla il riepilogo, premi **Salva e pubblica**. Apri la mappa in una finestra privata per verificare il risultato senza sessione Admin. Ripristina i valori iniziali se era solo una prova.

Il progetto Supabase è un servizio esterno con proprie quote e condizioni: controllale nel tuo account prima dell'attivazione. Non è stato creato né acquistato alcun servizio da questo pacchetto.

## Uso

- Per ogni borgo puoi cambiare il colore principale e il secondo colore del gradiente. Gli stemmi originali non cambiano. È disponibile anche la categoria “Da assegnare”.
- Cerca una via o un numero e scegli il nuovo borgo del singolo civico. Sono inclusi i civici generati dalle regole di via. La pagina presenta 40 risultati alla volta, con “Mostra altri”.
- Il riepilogo mostra tutti i valori prima e dopo la modifica. Solo **Salva e pubblica** li rende effettivi per tutti.
- I visitatori vedono le modifiche all'apertura o alla ricarica della mappa; le schede già aperte non vengono aggiornate in tempo reale.
- Se qualcun altro ha salvato nel frattempo, il server rifiuta il salvataggio obsoleto. Il riepilogo resta visibile: annota le tue modifiche, ricarica e ripetile sui dati aggiornati.
- La sessione resta solo in memoria, non in localStorage. Ricaricare Admin richiede un nuovo accesso. Alla scadenza le modifiche non salvate vengono eliminate: salva prima di allontanarti. “Esci” elimina la sessione locale e richiede la revoca al server.
- In caso di interruzione della rete durante il salvataggio, ricarica i dati per verificare se il server lo ha ricevuto, prima di ripeterlo.

## Persistenza e sicurezza

Supabase Auth verifica la password sul server. Le tabelle sono in uno schema privato non esposto all'API, con RLS abilitata e senza accesso diretto per i ruoli web. L'API espone una funzione di sola lettura pubblica e una funzione di salvataggio che verifica `auth.uid()` nell'elenco privato degli amministratori a ogni richiesta. Non usa ruoli derivati da campi modificabili del profilo utente.

Il server convalida civici, borghi e colori esadecimali; il salvataggio è atomico, usa un blocco sulla riga e controlla la revisione attesa. I dati pubblici non contengono email, password, UUID degli amministratori o storico. Lo storico privato conserva account, data, modifica e valori precedenti. Con la password condivisa tutte le modifiche risultano dello stesso account: non è possibile distinguere quale persona le abbia eseguite. Per togliere l’accesso a una sola persona devi cambiare la password condivisa e comunicarla agli altri. I token già emessi possono restare validi fino alla scadenza; per bloccare subito tutti i salvataggi rimuovi l’UUID dall’elenco Admin. Revocare l'UUID dall'elenco amministratori blocca i salvataggi successivi anche se il token non è ancora scaduto.

La chiave pubblicabile non è una password: la protezione risiede nei permessi del database. Non esporre lo schema `brandizzo_private` nelle impostazioni API e non concedere accessi diretti alle sue tabelle. Mantieni attive le limitazioni dei tentativi di accesso di Supabase Auth.

## Dati e compatibilità

La v3.28 caricava le coordinate dall'`index.html` del vecchio repository. Pubblicare il nuovo index sullo stesso percorso avrebbe eliminato quella sorgente. `coordinates.html` congela i 2.705 punti recuperati da quel sito, come dati separati, mantenendo il lettore originale. L'unione dei civici espliciti v3.28 e delle sue regole di via produce il catalogo amministrabile di 2.687 civici. I punti senza una corrispondenza o una regola non vengono trasformati in nuovi indirizzi.

La precedente memoria locale delle assegnazioni non è più usata: non deve prevalere sui dati condivisi. Nessun dato viene cancellato dal browser, ma la base pubblica parte sempre dalla v3.28 allegata e applica le modifiche del server prima di ricostruire punti, schede ed edifici. I colori aggiornano sia gli edifici sia i gradienti delle schede.

La mappa continua a dipendere dai servizi cartografici esterni originali. Se Supabase non risponde, usa la base v3.28 e avvisa che gli aggiornamenti non sono disponibili; quindi il fallback può essere meno aggiornato dell'ultima pubblicazione. Non viene presentato come una copia corrente.

Il colore di un edificio condiviso segue la logica originale; per verificare un'assegnazione individuale usa la ricerca del civico. La gestione originale dei conflitti tra civici dello stesso edificio non è stata ridisegnata.

## Storico e ripristino

Solo il proprietario del progetto consulta `brandizzo_private.history` dal SQL Editor. Per ispezionare gli ultimi salvataggi:

```sql
SELECT revision, actor, saved_at, patch
FROM brandizzo_private.history ORDER BY revision DESC LIMIT 20;
```

Per annullare una modifica ordinaria, reimposta i valori precedenti nell'Admin e salva: si ottiene una nuova revisione tracciata. Per un ripristino esteso usa le colonne `previous_colors` e `previous_assignments` con l'assistenza di chi gestisce il database. Configura backup/esportazioni del progetto secondo le opzioni del piano scelto; lo storico nello stesso database non sostituisce un backup esterno.

## Verifiche eseguite

- Migrazione SQL e catalogo eseguiti su PostgreSQL locale tramite PGlite.
- Lettura anonima consentita; scrittura anonima, di utenti non Admin e accesso diretto alle tabelle negati.
- Salvataggio Admin, validazione dei valori, storico, atomicità e conflitto di revisione verificati.
- Sintassi JavaScript della mappa e applicazione di colori/assegnazioni verificata.
- CSS pubblico e codice della geolocalizzazione Safari confrontati con il file allegato: invariati.
- Area Admin provata in Edge headless a 1280 e 390 pixel, con API simulate: login, modifica colori/civici, salvataggio, conflitto, logout e assenza di scorrimento orizzontale.

Non sono stati effettuati un accesso a un progetto Supabase reale, una pubblicazione GitHub Pages o un test GPS su un iPhone fisico. La verifica finale dell'installazione è descritta al punto 8.

Riferimenti: [password in Supabase Auth](https://supabase.com/docs/guides/auth/passwords), [permessi e RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
