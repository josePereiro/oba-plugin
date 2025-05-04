// import { readFileLineByLine } from "src/tools-base/files-tools";

// /*
//     Deal with filtering files/dirs between channels
// */

// export async function getNoteObaSyncScope(
//     path: string,
//     channelsConfig: any = obaconfig.getObaConfig("obasync.channels", {})
// ): Promise<string[]> {

//     // nullish
//     if (!path) { return null; }

//     const scopes: string[] = []
//     for (const channelName in channelsConfig) {
//         let inScope = false
    
//         // nullish
//         const channelConfig = channelsConfig?.[channelName] || null
//         if (!channelConfig) { continue; }

//         // search path
//         if (!inScope) {
//             const regexStrs = channelConfig?.["include.path.regexs"] || []
//             const regexs = regexStrs.map((str: string) => new RegExp(str))
//             for (const regx of regexs) {
//                 if (regx.test(path)) {
//                     inScope = true
//                     break;
//                 }
//             }
//         }
        
//         // search content
//         if (!inScope) {
//             const regexStrs = channelConfig?.["include.content.regexs"] || []
//             const regexs = regexStrs.map((str: string) => new RegExp(str))
//             await readFileLineByLine(path,
//                 (line: string, li: number) => {
//                     for (const regx of regexs) {
//                         if (regx.test(line)) {
//                             inScope = true;
//                             return inScope ? "break" : null;
//                         }
//                     }
//                 }
//             )
//         }

//         // push
//         if (!inScope) { continue; }
//         scopes.push(channelName)
//     }
//     return scopes
// }