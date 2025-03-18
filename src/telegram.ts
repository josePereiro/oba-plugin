// DeepSeek
import ObA from './main';

/*
    Add a few utils for interfacing with Telegram
*/
export class Telegram {

    constructor(private oba: ObA) {
        console.log("Telegram:constructor");
    }
}

// import { App, Plugin } from 'obsidian';
// // import { config } from 'dotenv';
// import { TelegramClient } from 'telegram';
// import { StringSession } from 'telegram/sessions';
// import { Api } from 'telegram';

// // Carica le variabili d'ambiente dal file .env
// // config();

// export default class Oba extends Plugin {
// 	async onload() {
// 		console.clear();

// 		console.log("kaka");
// 		console.log("Caricamento del plugin Telegram per Obsidian...");

// 		// Lettura delle credenziali dal file .env

// 		const apiId = this.oba.configfile.getConfig("telegram.api.id", null); //process.env.API_ID;
// 		const apiHash = this.oba.configfile.getConfig("telegram.api.hash", null); // process.env.API_HASH;

// 		if (!apiId || !apiHash) {
// 			console.error("API_ID o API_HASH non sono stati trovati nel file .env.");
// 			return;
// 		}

// 		// Inizializzazione della sessione Telegram
// 		const stringSession = new StringSession(""); // Se hai già una sessione salvata, puoi caricarla qui
// 		const client = new TelegramClient(stringSession, Number(apiId), apiHash, {
// 			connectionRetries: 5,
// 		});

// 		// Avvio del client e gestione dell'autenticazione
// 		await client.start({
// 			phoneNumber: async () => await this.requestInput("Inserisci il tuo numero di telefono:"),
// 			password: async () => await this.requestInput("Inserisci la tua password (se richiesta):"),
// 			phoneCode: async () => await this.requestInput("Inserisci il codice che hai ricevuto:"),
// 			onError: (err) => console.error(err),
// 		});

// 		console.log("Connesso a Telegram!");

// 		// Recupera gli ultimi 5 messaggi dalla chat "Messaggi Salvati"
// 		// In Telegram, "Messaggi Salvati" è la chat con se stessi, indicata con "me".
// 		try {
// 			const messages = await client.getMessages("me", { limit: 5 });
// 			console.log("Ultimi 5 messaggi salvati:", messages);

// 			// Costruisce il contenuto della nota
// 			let noteContent = "### Ultimi 5 Messaggi Salvati\n\n";
// 			messages.forEach((msg: Api.Message) => {
// 				// Assicurati che 'message' esista (alcuni messaggi potrebbero essere di tipo diverso)
// 				const text = (msg as any).message || "<messaggio non disponibile>";
// 				noteContent += `- ${text}\n`;
// 			});

// 			// Salva o aggiorna una nota in Obsidian
// 			const fileName = "Messaggi Salvati.md";
// 			const existingFile = this.app.vault.getAbstractFileByPath(fileName);
// 			if (existingFile) {
// 				await this.app.vault.modify(existingFile, noteContent);
// 			} else {
// 				await this.app.vault.create(fileName, noteContent);
// 			}

// 			console.log("Nota aggiornata con i messaggi scaricati.");
// 		} catch (error) {
// 			console.error("Errore nel recupero dei messaggi:", error);
// 		}
// 	}

// 	onunload() {
// 		console.log("Plugin Telegram per Obsidian disattivato.");
// 	}

// 	/**
// 	 * Metodo helper per richiedere input all'utente.
// 	 * Nota: in un ambiente reale potrebbe essere necessario implementare un metodo
// 	 * più robusto per ottenere input tramite interfaccia grafica o prompt.
// 	 */
// 	async requestInput(promptText: string): Promise<string> {
// 		// Per esempio, usando una finestra di dialogo semplificata.
// 		return new Promise((resolve) => {
// 			const input = window.prompt(promptText);
// 			resolve(input || "");
// 		});
// 	}
// }


