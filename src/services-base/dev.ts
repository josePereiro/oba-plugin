import { MarkdownView, Notice } from 'obsidian';
import { obaconfig } from 'src/oba-base/0-oba-modules';
import { addObaCommand } from 'src/oba-base/commands';
import { OBA } from 'src/oba-base/globals';
import { checkEnable, tools } from 'src/tools-base/0-tools-modules';
import { SimilarityModal } from '../tools-base/modals-tools';

/*
    TODO/ Make a log system controlable by a flag
    - The flag must be changable from Obsidian too (a command)
*/ 

/*
    A playground for new features
*/

// TODO/TAI/ See you can comunicate across plugins
// - At some point you can split functionalities 
// const plugin = app.plugins.getPlugin('super-uri') as SuperUriPlugin;

export function onload() {
    console.log("DevLand:onload");

    _URLHandler_onload();

    addObaCommand({
        commandName: "console.clear",
        serviceName: ["DevLand"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
        },
    })
    
}

// TODO/ implement thsi... To handle incoming comunication from backends
function _URLHandler_onload() {

    // Example: [link](obsidian://oba-uri?vault=MetXVault&_file=2_notes%2F%40alterProteomeRegulationPatterns2021.md&_line=101)


    const ACTION_NAME = 'open-with-line';
    // const ACTION_NAME = 'open';

    function getEditor() {
        const leaf = OBA.app.workspace.getActiveViewOfType(MarkdownView);
        if (leaf instanceof MarkdownView && leaf.getMode() === 'source') {
            return leaf.editor;
        }
        return null;
    }

    OBA.registerObsidianProtocolHandler(ACTION_NAME, async (params) => {
        console.clear()
        console.log("registerObsidianProtocolHandler:\n", params)
        // if (params.action !== ACTION_NAME) return;
        
        // if (!params.file) {
        //     console.log('No path specified for open-with-line');
        //     return;
        // }

        // try {
        //     await OBA.app.workspace.openLinkText('', params.file);
        //     const editor = this.getEditor();
            
        //     if (params.line && editor) {
        //         editor.setCursor({
        //             line: parseInt(params.line),
        //             ch: 0
        //         });
        //         editor.focus();
        //     }
        // } catch (error) {
        //     console.error('Error in open-with-line handler:', error);
        // }
    });
}


async function askLLM(question: string): Promise<string> {
    // const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";
    // const API_URL = "https://api-inference.huggingface.co/models/gpt2";
    // const API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1";
    const API_URL = "https://api-inference.huggingface.co/models/";
    
    // const API_TOKEN = "YOUR_HUGGINGFACE_API_KEY"; // Sostituiscilo con la tua chiave API gratuita
    const API_TOKEN = obaconfig.getObaConfig("huggingface.access.token", null)
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