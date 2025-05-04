export {}

// // Open file externally

// import { MarkdownRenderer, TFile } from 'obsidian';

// interface EmbedParameters {
//     "path": string;
//     "start-pt": string;
//     "end-pt": string;
//     // start: number;
//     // end: number;
//     "header": boolean
// }

// export class RangeView {
//     embedTag: 'embed-lines'

//     constructor(private oba: ObA) {
//             console.log("RangeView:onload");
//             this.oba.registerMarkdownPostProcessor(this.embedProcessor.bind(this));
//     }

//     // private async embedProcessor(element: HTMLElement, context: any) {
//     //     const embeds = element.querySelectorAll('code');
        
//     //     for (let i = 0; i < embeds.length; i++) {
//     //         const codeBlock = embeds[i];
//     //         if (codeBlock.className !== 'language-json:embed-lines') continue;
//     //         const codeContent = codeBlock.textContent;
//     //         const params = this.parseParameters(codeContent);
            
//     //         // if (!params.path) continue;
//     //         // if (!params.start) continue;
//     //         // if (!params.end) continue;

//     //         const sectionContent = await this.getFileContent(params);
//     //         const container = this.createEmbedContainer(params.path);
//     //         codeBlock.replaceWith(container);

//     //         // Find the content container safely
//     //         const contentDiv = container.querySelector('.markdown-embed-content-inner');
//     //         if (contentDiv instanceof HTMLElement) { // Ensure it's an HTMLElement
//     //             // Render the content as Markdown
//     //             // console.log('Rendering content into:', contentDiv); // Debugging: Log the container
//     //             await MarkdownRenderer.render(
//     //                 this.oba.app,
//     //                 sectionContent,
//     //                 contentDiv,
//     //                 params.path,
//     //                 this.oba
//     //             );
//     //         } else {
//     //             console.error('Embed content container not found');
//     //         }
//     //     }
//     // }

//     private async embedProcessor(element: HTMLElement) {
//         const embeds = element.querySelectorAll('code');
        
//         for (const codeBlock of Array.from(embeds)) {
//           try {
//             const params = this.parseParameters(codeBlock.textContent || '');
//             if (!params) continue;
    
//             const content = await this.getFileContent(params);
//             console.log("content: ", content)
//             const container = this.createEmbedContainer(params.path);
            
//             // Replace code block with our container
//             codeBlock.replaceWith(container);
            
//             // Get the target element for rendering
//             const renderTarget = container.querySelector('.markdown-preview-view');
//             if (!(renderTarget instanceof HTMLElement)) continue;
    
//             // Render the content using Obsidian's renderer
//             await MarkdownRenderer.render(
//               this.oba.app,
//               content,
//               renderTarget,
//               params.path,
//               this.oba
//             );
    
//             // Add Obsidian's default embed classes
//             container.findAll('.internal-embed').forEach(embed => {
//               embed.classList.add('is-loaded');
//             });
    
//           } catch (error) {
//             // this.oba.handleError(codeBlock, error.message);
//             throw new Error(`Failed to parse parameters: ${error.message}`);
//           }
//         }
//       }
    
//     private parseParameters(text: string): EmbedParameters | null {
//         try {
//             const cleanedText = text.replace(/(\r\n|\n|\r)/gm, "").trim();
//             const params = JSON.parse(cleanedText) as EmbedParameters;
            
//             // if (!params.path || typeof params.start !== 'number' || typeof params.end !== 'number') {
//             //     throw new Error('Invalid parameter format');
//             // }
            
//             return {
//                 "path": params["path"],
//                 "start-pt": params["start-pt"],
//                 "end-pt": params["end-pt"],
//                 "header": params?.["header"] ?? false

//                 // start: Math.max(1, params.start),
//                 // end: Math.max(params.start, params.end), 
//             };
//         } catch (error) {
//             throw new Error(`Failed to parse parameters: ${error.message}`);
//         }
//     }
    
//     // By line
//     // private async getFileContent(params: EmbedParameters) {
//     //     const file = this.oba.app.vault.getAbstractFileByPath(params.path + '.md');
//     //     if (!(file instanceof TFile)) return 'File not found';
        
//     //     try {
//     //       const content = await this.oba.app.vault.read(file);
//     //       const lines = content.split('\n').slice(params.start - 1, params.end);
//     //       return lines.join('\n');
//     //     } catch (error) {
//     //       return 'Error reading file';
//     //     }
//     // }

//     private async getFileContent(
//             params: EmbedParameters
//         ): Promise<string> {
//             const filePath = params.path;
//             const startRegex = new RegExp(params?.["start-pt"]);
//             const endRegex = new RegExp(params?.["end-pt"]);
            
//             const file = this.oba.app.vault.getAbstractFileByPath(filePath);
//             if (!(file instanceof TFile)) {
//                 throw new Error(`File not found: ${filePath}`);
//             }
            
//             const content = await this.oba.app.vault.read(file);
//             const lines = content.split('\n');
            
//             let startIndex = -1;
//             let endIndex = -1;
            
//             // Find the start line
//             for (let i = 0; i < lines.length; i++) {
//                 if (startRegex.test(lines[i])) {
//                     startIndex = i;
//                     break;
//                 }
//             }
            
//             // Find the end line
//             if (startIndex !== -1) {
//                 for (let i = startIndex + 1; i < lines.length; i++) {
//                     if (endRegex.test(lines[i])) {
//                         endIndex = i;
//                         break;
//                     }
//                 }
//             }
            
//             // Handle cases where matches are not found
//             if (startIndex === -1) {
//                 throw new Error(`Start regex not found: ${startRegex}`);
//             }
//             if (endIndex === -1) {
//                 throw new Error(`End regex not found: ${endRegex}`);
//             }
            
//             // Extract and return the content between the matches
//             return lines.slice(startIndex, endIndex + 1).join('\n');
//     }

//     // private createEmbedContainer(sourcePath: string) {
//     //     const container = document.createElement('div');
//     //     container.className = 'line-range-embed';
        
//     //     const header = document.createElement('div');
//     //     header.className = 'embed-header';
//     //     header.textContent = `Embed from ${sourcePath}`;
        
//     //     const contentDiv = document.createElement('div'); // Changed from <pre> to <div>
//     //     contentDiv.className = 'embed-content';
        
//     //     container.appendChild(header);
//     //     container.appendChild(contentDiv);
//     //     return container;
//     // }

//     // private createEmbedContainer(sourcePath: string): HTMLElement {
//     //     // Main container
//     //     const container = document.createElement('div');
//     //     container.className = 'internal-embed markdown-embed';
      
//     //     // Embed content wrapper
//     //     const embedWrapper = document.createElement('div');
//     //     embedWrapper.className = 'markdown-embed-content';
      
//     //     // Header
//     //     const header = document.createElement('div');
//     //     header.className = 'markdown-embed-title';
//     //     header.textContent = `Embed from ${sourcePath}`;
      
//     //     // Content container
//     //     const contentDiv = document.createElement('div');
//     //     contentDiv.className = 'markdown-embed-content-inner markdown-preview-view';
      
//     //     // Assemble the structure
//     //     embedWrapper.append(header, contentDiv);
//     //     container.appendChild(embedWrapper);
//     //     return container;
//     // }

//     private createEmbedContainer(sourcePath: string): HTMLElement {
//         // Replicate Obsidian's exact embed structure
//         const container = document.createElement('div');
//         container.classList.add('internal-embed', 'markdown-embed');
        
//         const contentWrapper = document.createElement('div');
//         contentWrapper.classList.add('markdown-embed-content');
        
//         const title = document.createElement('div');
//         title.classList.add('markdown-embed-title');
//         title.textContent = sourcePath;
        
//         const contentInner = document.createElement('div');
//         contentInner.classList.add('markdown-embed-content-inner');
        
//         const previewView = document.createElement('div');
//         previewView.classList.add('markdown-preview-view', 'markdown-rendered');
        
//         // Assemble the structure
//         contentInner.appendChild(previewView);
//         contentWrapper.append(title, contentInner);
//         container.appendChild(contentWrapper);
        
//         return container;
//     }
// }
