import { Notice } from 'obsidian';
import { SimilarityModal } from '../tools-base/modals-tools';
import { configfile } from 'src/oba-base/0-oba-modules';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';

/*
    A playground for new features
*/

export function onload() {
    console.log("Dev:onload");

    OBA.addCommand({
        id: 'oba-dev-cmd',
        name: 'Dev cmd',
        callback: () => {
            // () => { new Notice('hello oba') }, 
            // () => {
            // 	const question = this.tools.getSelectedText();
            // 	this.tools.askLLM(question).then(console.log).catch(console.error);
            // },
            // () => {
            // 	this.tools.insertAtCursor(this.tools.randstring("test.", 8))
            // }
            // () => {
            //     // Usage
            //     const colorModal = new SelectorModal(this.oba, ["A", "B", "C"]);
            //     colorModal.open();
            // }
            {
                const options = []
                for (let i = 0; i < 100; i++) {
                    options.push(tools.randstring('', 10))
                }
                const modal = new SimilarityModal(OBA, 
                    options,
                    (selectedOption) => {
                    console.log("Selected Option:", selectedOption);
                    // Do something with the selected option
                });
                modal.open();
            }
        }
    });
}

async function askLLM(question: string): Promise<string> {
    // const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";
    // const API_URL = "https://api-inference.huggingface.co/models/gpt2";
    // const API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1";
    const API_URL = "https://api-inference.huggingface.co/models/";
    
    // const API_TOKEN = "YOUR_HUGGINGFACE_API_KEY"; // Sostituiscilo con la tua chiave API gratuita
    const API_TOKEN = configfile.getConfig("huggingface.access.token", null)
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