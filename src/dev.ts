import { Notice } from 'obsidian';
import ObA from './main';
import { SelectorModal } from './modals';
import { exec } from 'child_process';

/*
    A playground for new features
*/
export class Dev {

    constructor(private oba: ObA) {
        console.log("Dev:constructor");

        this.oba.addCommand({
            id: 'oba-code-vault',
            name: 'Dev: Open the vault in an IDE, ej: vscode',
            callback: () => {
                this.codeVaultCmd()
            }
        });

        // 
        this.oba.callbacks.registerCallback("callback.oba-dev-cmd", 
            () => { new Notice('hello oba') }, 
            // () => {
            // 	const question = this.tools.getSelectedText();
            // 	this.tools.askLLM(question).then(console.log).catch(console.error);
            // },
            // () => {
            // 	this.tools.insertAtCursor(this.tools.randstring("test.", 8))
            // }
            () => {
                // Usage
                const colorModal = new SelectorModal(this.oba, ["A", "B", "C"]);
                colorModal.open();
            }
        )
        this.oba.addCommand({
            id: 'oba-dev-cmd',
            name: 'Dev cmd',
            callback: () => {
                this.oba.callbacks.runCallbacks("callback.oba-dev-cmd")
            }
        });
    }

    
    codeVaultCmd() {
        console.log(`codeVaultCmd`);
        const signalDelay = this.oba.configfile.getConfig("signal.delay", 300);
        setTimeout(() => { 
            
            // load config file
            const code = this.oba.configfile.getConfig("edit.vault.shell.cmd");
            if (typeof code !== 'string') {
                console.log(`Unformatted code section: `, code)
                return
            }
            
            //  run code
            exec(code, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });					
            
        }, signalDelay);
    }

    // TODO: Move to Dev
    async askLLM(question: string): Promise<string> {
        // const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";
        // const API_URL = "https://api-inference.huggingface.co/models/gpt2";
        // const API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1";
        const API_URL = "https://api-inference.huggingface.co/models/";
        
        // const API_TOKEN = "YOUR_HUGGINGFACE_API_KEY"; // Sostituiscilo con la tua chiave API gratuita
        const API_TOKEN = this.oba.configfile.getConfig("huggingface.access.token", null)
        if (!API_TOKEN) {
            new Notice("'huggingface.access.token' missing")
            return;
        }
    
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: question })
        });
    
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Errore API: ${data.error}`);
        }
    
        return data[0]?.generated_text || "No response";
    }
}