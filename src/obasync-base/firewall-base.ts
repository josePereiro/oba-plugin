import { readFileLineByLine } from "src/tools-base/files-tools";
import { getSyncChannelsConfig } from "./utils-base";

/*
    Deal with filtering files/dirs between channels
*/

export async function checkNotePublicStatus(
    path: string,
    channelName: string,
    channelsConfig: any = getSyncChannelsConfig({})
) {
    let isPublic = false
    
    // nullish
    if (!path) { return false; }
    const channelConfig = channelsConfig?.[channelName] || null
    if (!channelConfig) { return false; }

    // include path
    {
        const regexStrs = channelConfig?.["include.path.regexs"] || []
        const regexs = regexStrs.map((str: string) => new RegExp(str))
        for (const regx of regexs) {
            if (regx.test(path)) {
                return true;
            }
        }
    }
    
    // include regexs
    {
        const regexStrs = channelConfig?.["include.content.regexs"] || []
        const regexs = regexStrs.map((str: string) => new RegExp(str))
        await readFileLineByLine(path,
            (line: string, li: number) => {
                for (const regx of regexs) {
                    if (regx.test(line)) {
                        isPublic = true;
                        return "break";
                    }
                }
                return;
            }
        )
    }

    return isPublic
}