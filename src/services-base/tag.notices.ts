import { Notice, TFile } from 'obsidian';
import { OBA } from 'src/oba-base/globals';
import { checkEnable, readFileLineByLine, TriggerManager } from 'src/tools-base/0-tools-modules';
import { getCurrNotePath } from 'src/tools-base/obsidian-tools';
import * as obaconfig from '../oba-base/obaconfig';

// TODO: Add checkout current file git cmd
const ON_CHANGED_NOTICE_DELAY = new TriggerManager()
const ON_OPENED_NOTICE_DELAY = new TriggerManager()

export function onload() {
    console.log("TagNotices:onload");

    // controlFlow

    // 'changed'
    if (checkEnable("tagnotices", {err: false, notice: false})) {
        OBA.registerEvent(
            OBA.app.workspace.on('editor-change', async (editor, info) => {
                const file = getCurrNotePath();
                if (!file) { return }
                
                // flowControl
                await ON_CHANGED_NOTICE_DELAY.manage({
                    ignoreTime: 1000,
                    sleepTime: 100,
                    delayTime: -1,
                    async ongo() {
                        await execNotices(file, 'changed');
                    },
                })
                
            })
        );
    
        // 'file-open'
        OBA.registerEvent(
            OBA.app.workspace.on('file-open', async (_: TFile) => {
                const file = getCurrNotePath();
                if (!file) { return }
                
                // flowControl
                await ON_OPENED_NOTICE_DELAY.manage({
                    ignoreTime: 300,
                    sleepTime: 100,
                    delayTime: -1,
                    async ongo() {
                        await execNotices(file, 'file-open');
                    },
                })
            })
        );
    }
    
}

export function tagNoticesConfig() {
    return obaconfig.getObaConfig("tag.notices", null)
}

/*
    TODO/ create interface for notices
*/ 
export async function execNotices(file: string, event0: string) {
    
    if (!file) { return }

    const noticeConfig = tagNoticesConfig();
    // console.log("noticeConfig: ", noticeConfig);
    if (!noticeConfig) return
    // const filetags = getTags(file);
    
    for (const notice of noticeConfig) {
        // console.log(notice)
        if (notice?.["ignore"]) continue;
        const hasEvent = notice?.['where']?.some((event: string) => event == event0)
        if (!hasEvent) continue;
        const msg = notice?.['msg'];
        
        const trigger = notice?.['trigger'];
        if (!trigger) continue;
        if (!msg) continue;
        const tagptn = notice?.['tag'];
        if (!tagptn) continue;
        const regex = new RegExp(tagptn)
        // const hasTag = filetags?.some(obj => regex.test(obj.tag));
        let hasTag = false
        await readFileLineByLine(file,
            (line: string, li: number) => {
                if (regex.test(line)) {
                    hasTag = true;
                    return hasTag ? "break" : null;
                }
            }
        )
        if (trigger == "missing" && hasTag) continue;
        if (trigger == "present" && !hasTag) continue;
        new Notice(msg)
    }
}
