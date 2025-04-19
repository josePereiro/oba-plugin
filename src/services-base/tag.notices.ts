import { Notice, TFile } from 'obsidian';
import * as obaconfig from '../oba-base/obaconfig'
import { checkEnable, DelayManager, readFileLineByLine, tools } from 'src/tools-base/0-tools-modules';
import { OBA } from 'src/oba-base/globals';
import { getCurrNote, getCurrNotePath, getTags, resolveNoteAbsPath } from 'src/tools-base/obsidian-tools';
import { getNoteConfigPath } from 'src/obanotes-base/noteconfig';

// TODO: Add checkout current file git cmd
const ON_CHANGED_NOTICE_DELAY: DelayManager = new DelayManager(300, 100, -1, -1)
const ON_OPENED_NOTICE_DELAY: DelayManager = new DelayManager(300, 100, -1, -1)

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
                const flag = await ON_CHANGED_NOTICE_DELAY.manageTime()
                if (flag == "notyet") { return; }

                await execNotices(file, 'changed');
            })
        );
    
        // 'file-open'
        OBA.registerEvent(
            OBA.app.workspace.on('file-open', async (_: TFile) => {
                const file = getCurrNotePath();
                if (!file) { return }
                
                // flowControl
                const flag = await ON_OPENED_NOTICE_DELAY.manageTime()
                if (flag == "notyet") { return; }

                await execNotices(file, 'file-open');
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
