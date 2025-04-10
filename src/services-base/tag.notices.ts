import { Notice, TFile } from 'obsidian';
import * as obaconfig from '../oba-base/obaconfig'
import { tools } from 'src/tools-base/0-tools-modules';
import { OBA } from 'src/oba-base/globals';
import { getCurrNote, getTags } from 'src/tools-base/obsidian-tools';

// TODO: Add checkout current file git cmd

export function onload() {
    console.log("TagNotices:onload");

    // 'changed'
    OBA.registerEvent(
        OBA.app.workspace.on('editor-change', (editor, info) => {
            const activeFile = getCurrNote();
            if (!activeFile) { return }
            execNotices(activeFile, 'changed');
        })
    );

    // 'file-open'
    OBA.registerEvent(
        OBA.app.workspace.on('file-open', (file: TFile) => {
            execNotices(file, 'file-open');
        })
    );
}

export function tagNoticesConfig() {
    return obaconfig.getObaConfig("tag.notices", null)
}

/*
    TODO/ create interface for notices
*/ 
export function execNotices(file: TFile, event0: string) {
    const noticeConfig = tagNoticesConfig();
    // console.log("noticeConfig: ", noticeConfig);
    if (!noticeConfig) return
    const filetags = getTags(file);
    
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
        const hasTag = filetags?.some(obj => regex.test(obj.tag));
        if (trigger == "missing" && hasTag) continue;
        if (trigger == "present" && !hasTag) continue;
        new Notice(msg)
    }
}
